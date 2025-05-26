const axios = require('axios');

console.log('Middleware chatService.js loaded. Ready for Gemini communication.');

/**
 * Sends a message to the Gemini API and returns the model's response.
 * @param {string} apiKey - The Gemini API key.
 * @param {string} userMessage - The user's current message.
 * @param {Array<{role: 'user' | 'model', parts: [{text: string}]}>} chatHistory - Previous messages in the conversation.
 * @returns {Promise<string | null>} The text response from Gemini, or null if an error occurs.
 */
const { performSearch } = require('../search/searchLogic');
const path = require('path'); // For constructing paths if needed

// Define the local_file_search tool for Gemini
const localSearchTool = {
  functionDeclarations: [
    {
      name: 'local_file_search',
      description: 'Searches for keywords in local project files (HTML, TeX, INP, OP) within the /home/zoltan/mctdh directory. Can also search specific subdirectories and filter by file extension.',
      parameters: {
        type: 'OBJECT',
        properties: {
          search_query: {
            type: 'STRING',
            description: 'The keywords or phrases to search for in the files.'
          },
          file_extensions: {
            type: 'ARRAY',
            description: 'Optional. An array of specific file extensions to target (e.g., [\".inp\", \".op\"]). Defaults to [\".html\", \".tex\", \".inp\", \".op\"] if not provided.',
            items: {
              type: 'STRING'
            }
          },
          sub_directory: {
            type: 'STRING',
            description: 'Optional. A specific subdirectory within /home/zoltan/mctdh to focus the search on (e.g., \"inputs\", \"docs/latex\"). If not provided, searches the entire /home/zoltan/mctdh directory.'
          }
        },
        required: ['search_query']
      }
    }
  ]
};

async function sendChatMessageToGemini(apiKey, userMessage, chatHistory = []) {
  if (!apiKey) {
    console.error('Gemini API key is missing.');
    return { error: 'API key is missing. Please set it in settings.' };
  }
  if (!userMessage) {
    console.error('User message is empty.');
    return { error: 'Cannot send an empty message.' };
  }

  const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // Construct the conversation history for the API
  const contents = [
    ...chatHistory, // Spread existing history
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  try {
    console.log(`Sending to Gemini: ${userMessage.substring(0, 50)}...`);
    const requestBody = {
      contents: contents,
      tools: [localSearchTool],
      // Optional: Add generationConfig if needed
    };

    console.log(`Sending to Gemini: ${userMessage.substring(0, 50)}... Tools:`, JSON.stringify(requestBody.tools));
    const response = await axios.post(API_ENDPOINT, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Extract text from the response
    // The response structure can be complex, adjust based on actual API output
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const part = candidate.content.parts[0];
        if (part.text) {
          const geminiResponseText = part.text; // Assuming single text part for now
          console.log(`Gemini text response: ${geminiResponseText.substring(0, 50)}...`);
          return { text: geminiResponseText };
        } else if (part.functionCall) {
          // Gemini wants to use our tool!
          const functionCall = part.functionCall;
          console.log(`Gemini function call: ${functionCall.name}`, functionCall.args);

          if (functionCall.name === 'local_file_search') {
            const searchParams = functionCall.args;
            console.log('Executing local_file_search with params:', searchParams);

            const searchOptions = {
              query: searchParams.search_query,
              baseRootDir: '/home/zoltan/mctdh', // As per MEMORY[245efb1b-2a5b-49c1-ba6c-e71804d2e89a]
              exclusions: ['/home/zoltan/mctdh/docs_tool'], // Exclude the tool's own directory
              targetExtensions: searchParams.file_extensions, // Will use defaults in searchLogic if undefined
              subDirectory: searchParams.sub_directory
            };

            const searchResults = await performSearch(searchOptions);
            console.log(`Local search found ${searchResults.length} items.`);

            // Prepare the tool response to send back to Gemini
            const toolExecutionResponse = {
              role: 'tool',
              parts: [{
                functionResponse: {
                  name: 'local_file_search',
                  response: {
                    status: 'success',
                    files_found: searchResults.map(r => ({ // Send a summary to Gemini
                        fileName: r.fileName,
                        relativePath: r.relativePath,
                        snippet: r.snippet
                    })).slice(0, 10) // Limit to top 10 results to avoid overly long prompts
                  }
                }
              }]
            };

            // Add the model's function call turn and the tool's response to the conversation history
            // 'contents' is the history up to the user's last message
            // 'candidate.content' is the model's turn that contained the functionCall
            // 'toolExecutionResponse' is our response to that functionCall
            const newContents = [...contents, candidate.content, toolExecutionResponse];

            // --- Detailed Debugging for Function Call Response ---
            try {
              console.log('\n--- Debugging Function Call Response ---');
              console.log('Original `contents` for 1st call (history up to current user msg):', JSON.stringify(contents, null, 2));
              console.log('Model turn that included functionCall (candidate.content):', JSON.stringify(candidate.content, null, 2));
              console.log('Tool execution response (toolExecutionResponse):', JSON.stringify(toolExecutionResponse, null, 2));
              console.log('Combined `newContents` for 2nd call:', JSON.stringify(newContents, null, 2));

              if (candidate.content && candidate.content.parts) {
                console.log('Number of parts in model turn (candidate.content.parts.length):', candidate.content.parts.length);
                if (candidate.content.parts.length > 0 && candidate.content.parts[0].functionCall) {
                  console.log('Model turn part [0] is indeed a functionCall.');
                } else {
                  console.log('Model turn part [0] is NOT a functionCall, or parts array is empty/malformed.');
                }
              } else {
                console.log('candidate.content.parts is undefined or null.');
              }
              console.log('Number of parts in tool response (toolExecutionResponse.parts.length):', toolExecutionResponse.parts.length);
              console.log('--- End Debugging --- \n');
            } catch (debugError) {
              console.error('Error during debug logging:', debugError);
            }
            // --- End Detailed Debugging ---
            
            console.log('Sending tool execution results back to Gemini...');
            const finalApiResponse = await axios.post(API_ENDPOINT, {
              contents: newContents
              // Removed tools: [localSearchTool] from the follow-up call
            }, {
              headers: { 'Content-Type': 'application/json' }
            });

            if (finalApiResponse.data && finalApiResponse.data.candidates && finalApiResponse.data.candidates.length > 0) {
              const finalCandidate = finalApiResponse.data.candidates[0];
              if (finalCandidate.content && finalCandidate.content.parts && finalCandidate.content.parts[0].text) {
                const finalTextResponse = finalCandidate.content.parts[0].text;
                console.log(`Gemini final response: ${finalTextResponse.substring(0, 50)}...`);
                return { text: finalTextResponse };
              } else {
                 console.error('Gemini final response did not contain text after tool call:', finalCandidate.content);
                 return { error: 'Gemini did not provide a text response after tool execution.' };
              }
            } else {
              console.error('Unexpected final response structure from Gemini API after tool call:', finalApiResponse.data);
              return { error: 'Failed to parse final response from Gemini after tool call.' };
            }
          }
        }
      } else if (candidate.finishReason === 'SAFETY') {
        console.warn('Gemini response blocked due to safety reasons:', candidate.safetyRatings);
        return { error: 'Response blocked due to safety settings. Please rephrase your message or check content policies.' };
      }
    }
    console.error('Unexpected response structure from Gemini API:', response.data);
    console.error('Unexpected content part structure from Gemini API:', candidate.content.parts);
    return { error: 'Failed to parse response from Gemini. Unexpected content part structure.' };

  } catch (error) {
    console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
    if (error.response && error.response.data && error.response.data.error) {
      const errDetails = error.response.data.error;
      return { error: `Gemini API Error: ${errDetails.message} (Status: ${errDetails.status})` };
    }
    return { error: 'An unexpected error occurred while communicating with Gemini.' };
  }
}

module.exports = { sendChatMessageToGemini };
