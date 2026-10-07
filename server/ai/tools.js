// server/ai/tools.js
const mongoose = require('mongoose');

const databaseTools = [
  {
    type: "function", // ✅ REQUIRED BY MISTRAL
    function: {       // ✅ REQUIRED BY MISTRAL
      name: "executeMongoQuery",
      description: "Execute ANY MongoDB query. Use for counts, lists, filters, or stats across Users, Mentorships, Sessions, or Feedbacks.",
      parameters: {
        type: "object",
        properties: {
          modelName: { 
            type: "string", 
            enum: ["User", "Mentorship", "Session", "Feedback"],
            description: "Target collection" 
          },
          operation: { 
            type: "string", 
            enum: ["find", "countDocuments", "findOne", "aggregate"],
            description: "Mongoose method" 
          },
          filter: { 
            type: "string", 
            description: "JSON filter string e.g. '{\"role\":\"mentor\",\"department\":\"CSE\"}'" 
          },
          select: { 
            type: "string", 
            description: "Fields to return as JSON string e.g. '{\"name\":1,\"email\":1}'",
            default: "{}"
          },
          limit: { type: "number", default: 20 },
          sort: { 
            type: "string", 
            description: "Sort order as JSON string e.g. '{\"createdAt\":-1}'",
            default: "{}"
          }
        },
        required: ["modelName", "operation", "filter"]
      }
    },
    execute: async ({ modelName, operation, filter, select = "{}", limit = 20, sort = "{}" }) => {
      try {
        if (!["User", "Mentorship", "Session", "Feedback"].includes(modelName)) {
          return `Error: Invalid model. Use: User, Mentorship, Session, Feedback`;
        }

        const Model = mongoose.model(modelName);
        const f = JSON.parse(filter);
        const s = JSON.parse(select);
        const so = JSON.parse(sort);

        let result;
        switch (operation) {
          case 'countDocuments':
            result = await Model.countDocuments(f);
            break;
          case 'findOne':
            result = await Model.findOne(f).select(s).sort(so);
            break;
          case 'find':
            result = await Model.find(f).select(s).sort(so).limit(limit);
            break;
          case 'aggregate':
            const pipeline = JSON.parse(filter);
            result = await Model.aggregate(pipeline).limit(limit);
            break;
          default:
            return `Error: Unknown operation`;
        }

        return JSON.stringify(result, null, 2);
      } catch (err) {
        return `Query Error: ${err.message}. Check field names in schema reference.`;
      }
    }
  }
];

module.exports = { databaseTools };