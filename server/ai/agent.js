// server/ai/agent.js
const { ChatMistralAI } = require("@langchain/mistralai");
const { HumanMessage, ToolMessage } = require("@langchain/core/messages");
const { databaseTools } = require("./tools");
const { getFullDatabaseSchema } = require("./schemaLoader");

const DB_SCHEMA = getFullDatabaseSchema();

const SYSTEM_PROMPT = `You are Saathi AI Assistant with FULL READ ACCESS to the mentorship database.

CRITICAL RULES:
1. ALWAYS use executeMongoQuery tool for data questions. NEVER guess.
2. Use EXACT field names from the schema reference below.
3. For "my X" questions, use CURRENT USER ID provided in context.
4. Limit all list queries to 20 results max.
5. Format responses as clean bullet points or short summaries.

QUERY MAPPING GUIDE:
- "How many X?" → operation: "countDocuments", filter: '{"field":"value"}'
- "List/Show me X" → operation: "find", filter: '{"field":"value"}', select: '{"name":1,"email":1}'
- "My mentor/mentee" → operation: "findOne" on Mentorship with current userId
- "Pending verifications" → operation: "find" on Session with filter '{"participants.verificationStatus":"pending"}'
- "Average rating" → operation: "aggregate" on Feedback with $group/$avg

${DB_SCHEMA}`;

class SaathiAIAgent {
  constructor() { this.initialized = false; }

  async initialize() {
    if (this.initialized) return;
    this.llm = new ChatMistralAI({
      model: "mistral-small-latest",
      temperature: 0.7,
      apiKey: process.env.MISTRAL_API_KEY,
    }).bindTools(databaseTools);
    this.initialized = true;
    console.log("✅ Saathi AI Agent initialized (Schema-Aware)");
  }

  async processQuery(query, userId, userName, userRole) {
    if (!this.initialized) await this.initialize();

    const ctx = `CURRENT USER: ${userName} (${userRole}), ID: ${userId}\nQUESTION: ${query}`;

    const res1 = await this.llm.invoke([
      new HumanMessage(SYSTEM_PROMPT),
      new HumanMessage(ctx)
    ]);

    if (!res1.tool_calls?.length) return res1.content;

    const results = await Promise.all(
      res1.tool_calls.map(async (tc) => {
        const tool = databaseTools.find(t => t.name === tc.name);
        const r = await tool.execute(tc.args);
        return new ToolMessage({ content: r, tool_call_id: tc.id });
      })
    );

    const res2 = await this.llm.invoke([
      new HumanMessage(SYSTEM_PROMPT),
      new HumanMessage(ctx),
      res1,
      ...results
    ]);

    return res2.content;
  }

  async getStatus() {
    return { initialized: this.initialized, toolsCount: databaseTools.length };
  }
}

module.exports = new SaathiAIAgent();