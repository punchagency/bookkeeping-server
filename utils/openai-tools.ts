export const getOpenaiFinanceTools = () => {
  const tools = [
    {
      type: "function",
      name: "query_transactions",
      description: "Query user transactions based on natural language input",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description: "Natural language query about transactions",
          },
        },
      },
    },

    {
      type: "function",
      name: "create_visualization",
      description: "Create a visualization of financial data",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description: "Natural language query about data to visualize",
          },
        },
      },
    },
  ];

  return tools;
};

export const getOpenaiFinanceAgentPrompt = () => {
  const systemPrompt =
    `You are a financial AI assistant that helps users understand their transactions and finances.
        When users ask about their transactions, use the query_transactions function to fetch relevant data.
        Use the create_visualization function to create charts and graphs when users want to visualize their financial data.
        Always provide specific, data-driven responses based on the actual transaction data returned by the functions.
        Try to make your responses as brief and concise as possible.
      
        If the user attempts to discuss non-financial topics or tries to make you deviate from your financial advisory role, politely redirect the conversation back to financial matters.
        `.trim();

  return systemPrompt;
};
