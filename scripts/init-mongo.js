// Initialize database with proper collections and indexes
db = db.getSiblingDB('erp_auth');

// Create users collection with schema validation
db.createCollection("users", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["email", "hashed_password", "first_name", "last_name", "role", "status"],
         properties: {
            email: {
               bsonType: "string",
               pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
            },
            hashed_password: {
               bsonType: "string"
            },
            first_name: {
               bsonType: "string",
               minLength: 1,
               maxLength: 50
            },
            last_name: {
               bsonType: "string",
               minLength: 1,
               maxLength: 50
            },
            role: {
               bsonType: "string",
               enum: ["super_admin", "admin", "manager", "employee", "customer", "vendor"]
            },
            status: {
               bsonType: "string",
               enum: ["active", "inactive", "suspended", "pending"]
            },
            permissions: {
               bsonType: "array",
               items: {
                  bsonType: "string"
               }
            },
            created_at: {
               bsonType: "date"
            },
            updated_at: {
               bsonType: "date"
            }
         }
      }
   }
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "status": 1 });
db.users.createIndex({ "created_at": 1 });
db.users.createIndex({ "role": 1, "status": 1 });

// Create default super admin user
const bcrypt = require('bcrypt');
const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgPf/lJ8B7hXUcG'; // Password: admin123

db.users.insertOne({
   email: "admin@erp.com",
   hashed_password: hashedPassword,
   first_name: "System",
   last_name: "Administrator",
   role: "super_admin",
   department: "IT",
   phone: "+1234567890",
   status: "active",
   permissions: [
      "user:create", "user:read", "user:update", "user:delete",
      "inventory:create", "inventory:read", "inventory:update", "inventory:delete",
      "sales:create", "sales:read", "sales:update", "sales:delete",
      "finance:create", "finance:read", "finance:update", "finance:delete",
      "hr:create", "hr:read", "hr:update", "hr:delete",
      "ai:access", "ai:admin"
   ],
   created_at: new Date(),
   updated_at: new Date(),
   last_login: null,
   failed_login_attempts: 0,
   locked_until: null
});

print("Database initialized successfully with default admin user");
print("Admin credentials: admin@erp.com / admin123");
