// server/ai/schemaLoader.js
const mongoose = require('mongoose');

exports.getFullDatabaseSchema = () => {
  const models = mongoose.modelNames();
  let schemaDescription = "=== DATABASE SCHEMA REFERENCE (USE EXACT FIELD NAMES) ===\n\n";

  models.forEach(modelName => {
    const model = mongoose.model(modelName);
    const paths = model.schema.paths;
    
    schemaDescription += `## Collection: ${model.collection.name} (Model: ${modelName})\n`;
    Object.keys(paths).forEach(field => {
      if (field === '__v' || field === '_id') return;
      const path = paths[field];
      const type = path.instance || 'Mixed';
      const ref = path.options?.ref ? ` [Ref: ${path.options.ref}]` : '';
      const enumVals = path.options?.enum ? ` [Enum: ${path.options.enum.join(', ')}]` : '';
      schemaDescription += `  - ${field}: ${type}${ref}${enumVals}\n`;
    });
    schemaDescription += "\n";
  });

  return schemaDescription;
};