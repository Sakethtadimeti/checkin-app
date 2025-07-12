# 🌱 Seed Users Setup Documentation

This document contains the complete list of seed users created by the `create-seed-users.ts` script.

## 📊 User Summary

- **Total Users**: 12
- **Managers**: 2
- **Team Members**: 10 (5 per manager)
- **Teams**: 2 (Engineering & Product)

## 🔐 Authentication Details

- **Password**: `password123` (for all users)
- **Authentication**: JWT-based via mock Cognito server
- **Login Endpoint**: `POST /api/v1/login`

## 👥 All Users

| Name                | Email                         | Password      | Role      | Team               | Manager       |
| ------------------- | ----------------------------- | ------------- | --------- | ------------------ | ------------- |
| **Sarah Johnson**   | `sarah.johnson@company.com`   | `password123` | `manager` | `engineering-team` | `null`        |
| **Michael Chen**    | `michael.chen@company.com`    | `password123` | `manager` | `product-team`     | `null`        |
| **Alex Rodriguez**  | `alex.rodriguez@company.com`  | `password123` | `member`  | `engineering-team` | Sarah Johnson |
| **Emma Wilson**     | `emma.wilson@company.com`     | `password123` | `member`  | `engineering-team` | Sarah Johnson |
| **David Kim**       | `david.kim@company.com`       | `password123` | `member`  | `engineering-team` | Sarah Johnson |
| **Lisa Patel**      | `lisa.patel@company.com`      | `password123` | `member`  | `engineering-team` | Sarah Johnson |
| **James Anderson**  | `james.anderson@company.com`  | `password123` | `member`  | `engineering-team` | Sarah Johnson |
| **Sophia Garcia**   | `sophia.garcia@company.com`   | `password123` | `member`  | `product-team`     | Michael Chen  |
| **Ryan Thompson**   | `ryan.thompson@company.com`   | `password123` | `member`  | `product-team`     | Michael Chen  |
| **Olivia Martinez** | `olivia.martinez@company.com` | `password123` | `member`  | `product-team`     | Michael Chen  |
| **Daniel Lee**      | `daniel.lee@company.com`      | `password123` | `member`  | `product-team`     | Michael Chen  |
| **Ava Brown**       | `ava.brown@company.com`       | `password123` | `member`  | `product-team`     | Michael Chen  |

### 📝 Notes:

- **User IDs**: Auto-generated UUIDs when users are created
- **Manager IDs**: Automatically set based on team assignment
- **Timestamps**: Auto-generated when users are created
- **Password Hashing**: Passwords are hashed using bcrypt before storage

## 🏗️ Team Structure

```
Company
├── Engineering Team (sarah.johnson@company.com)
│   ├── Alex Rodriguez
│   ├── Emma Wilson
│   ├── David Kim
│   ├── Lisa Patel
│   └── James Anderson
│
└── Product Team (michael.chen@company.com)
    ├── Sophia Garcia
    ├── Ryan Thompson
    ├── Olivia Martinez
    ├── Daniel Lee
    └── Ava Brown
```

## 🚀 Usage Instructions

### Creating Seed Users

```bash
cd scripts
sh setup-all.sh
```

### Testing Login

You can test login with any of the above users:

```bash
curl -X POST http://localhost:3001/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@company.com",
    "password": "password123"
  }'
```

### Listing All Users

```bash
cd scripts
npm run list-users
```

## 📝 Notes

- **User IDs**: Auto-generated UUIDs when users are created
- **Manager IDs**: Automatically set based on team assignment
- **Timestamps**: Auto-generated when users are created
- **Password Hashing**: Passwords are hashed using bcrypt before storage
- **Duplicate Prevention**: Script skips users that already exist

## 🔧 Script Features

- **Idempotent**: Safe to run multiple times
- **Error Handling**: Continues on individual user failures
- **Progress Logging**: Detailed console output
- **Validation**: Checks for existing users before creation
- **Team Assignment**: Automatically assigns manager relationships
