import { OpenAPIV3 } from "openapi-types";

export const swaggerDefinition: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "School Management System API",
    version: "1.0.0",
    description: "API documentation for the School Management System",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Students", description: "Student management endpoints" },
    { name: "Teachers", description: "Teacher management endpoints" },
    { name: "Classes", description: "Class management endpoints" },
    { name: "Subjects", description: "Subject management endpoints" },
    { name: "Attendance", description: "Attendance tracking endpoints" },
    { name: "Grades", description: "Grade management endpoints" },
    { name: "Timetable", description: "Timetable management endpoints" },
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Admin", description: "Admin management endpoints" },
  ],
  components: {
    schemas: {
      Student: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          student_code: { type: "string" },
          first_name: { type: "string" },
          last_name: { type: "string" },
          phone: { type: "string" },
          user_id: { type: "string", format: "uuid" },
          enrollment_status: {
            type: "string",
            enum: ["pending", "active", "inactive", "graduated"],
          },
          date_of_birth: { type: "string", format: "date" },
          gender: { type: "string", enum: ["male", "female", "other"] },
          address: { type: "string" },
          enrollment_date: { type: "string", format: "date" },
          emergency_contact_name: { type: "string" },
          emergency_contact_phone: { type: "string" },
          medical_notes: { type: "string" },
          class_id: { type: "string", format: "uuid", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      CreateStudentRequest: {
        type: "object",
        required: ["user_id", "student_code", "date_of_birth", "gender"],
        properties: {
          user_id: { type: "string", format: "uuid" },
          student_code: { type: "string" },
          date_of_birth: { type: "string", format: "date" },
          gender: { type: "string", enum: ["male", "female", "other"] },
          address: { type: "string" },
          enrollment_status: {
            type: "string",
            enum: ["pending", "active", "inactive", "graduated"],
            default: "pending",
          },
          enrollment_date: { type: "string", format: "date" },
          emergency_contact_name: { type: "string" },
          emergency_contact_phone: { type: "string" },
          medical_notes: { type: "string" },
          class_id: { type: "string", format: "uuid" },
        },
      },
      Subject: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          code: { type: "string" },
          description: { type: "string" },
          credits: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Class: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          grade_level: { type: "string" },
          academic_year: { type: "string" },
          teacher_id: { type: "string", format: "uuid" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Attendance: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          student_id: { type: "string", format: "uuid" },
          class_id: { type: "string", format: "uuid" },
          date: { type: "string", format: "date" },
          status: {
            type: "string",
            enum: ["present", "absent", "late", "excused"],
          },
          notes: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Grade: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          student_id: { type: "string", format: "uuid" },
          subject_id: { type: "string", format: "uuid" },
          grade: { type: "number", format: "float" },
          max_grade: { type: "number", format: "float" },
          grade_type: {
            type: "string",
            enum: ["assignment", "quiz", "exam", "project", "final"],
          },
          comments: { type: "string" },
          graded_date: { type: "string", format: "date" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Timetable: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          class_id: { type: "string", format: "uuid" },
          subject_id: { type: "string", format: "uuid" },
          teacher_id: { type: "string", format: "uuid" },
          day_of_week: {
            type: "string",
            enum: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
          start_time: { type: "string", format: "time" },
          end_time: { type: "string", format: "time" },
          room: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", default: false },
          error: { type: "string" },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", default: true },
          message: { type: "string" },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "auth-token",
      },
    },
  },
  paths: {
    "/api/students": {
      get: {
        tags: ["Students"],
        summary: "Get all students",
        description: "Retrieve a list of all students in the system",
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    students: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Student" },
                    },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Students"],
        summary: "Create a new student",
        description: "Create a new student record",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStudentRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Student created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    student: { $ref: "#/components/schemas/Student" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/subjects": {
      get: {
        tags: ["Subjects"],
        summary: "Get all subjects",
        description: "Retrieve a list of all subjects",
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    subjects: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Subject" },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Subjects"],
        summary: "Create a new subject",
        description: "Create a new subject",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "code"],
                properties: {
                  name: { type: "string" },
                  code: { type: "string" },
                  description: { type: "string" },
                  credits: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Subject created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    subject: { $ref: "#/components/schemas/Subject" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/attendance": {
      get: {
        tags: ["Attendance"],
        summary: "Get attendance records",
        description: "Retrieve attendance records with optional filters",
        parameters: [
          {
            name: "student_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by student ID",
          },
          {
            name: "class_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by class ID",
          },
          {
            name: "date",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Filter by date",
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    attendance: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Attendance" },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Attendance"],
        summary: "Record attendance",
        description: "Create a new attendance record",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["student_id", "class_id", "date", "status"],
                properties: {
                  student_id: { type: "string", format: "uuid" },
                  class_id: { type: "string", format: "uuid" },
                  date: { type: "string", format: "date" },
                  status: {
                    type: "string",
                    enum: ["present", "absent", "late", "excused"],
                  },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Attendance recorded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    attendance: { $ref: "#/components/schemas/Attendance" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/grades": {
      get: {
        tags: ["Grades"],
        summary: "Get grades",
        description: "Retrieve grade records",
        parameters: [
          {
            name: "student_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by student ID",
          },
          {
            name: "subject_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by subject ID",
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    grades: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Grade" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Grades"],
        summary: "Create a grade",
        description: "Create a new grade record",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "student_id",
                  "subject_id",
                  "grade",
                  "max_grade",
                  "grade_type",
                ],
                properties: {
                  student_id: { type: "string", format: "uuid" },
                  subject_id: { type: "string", format: "uuid" },
                  grade: { type: "number", format: "float" },
                  max_grade: { type: "number", format: "float" },
                  grade_type: {
                    type: "string",
                    enum: ["assignment", "quiz", "exam", "project", "final"],
                  },
                  comments: { type: "string" },
                  graded_date: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Grade created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    grade: { $ref: "#/components/schemas/Grade" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/timetable": {
      get: {
        tags: ["Timetable"],
        summary: "Get timetable entries",
        description: "Retrieve timetable entries",
        parameters: [
          {
            name: "class_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by class ID",
          },
          {
            name: "teacher_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by teacher ID",
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    timetable: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Timetable" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Timetable"],
        summary: "Create timetable entry",
        description: "Create a new timetable entry",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "class_id",
                  "subject_id",
                  "teacher_id",
                  "day_of_week",
                  "start_time",
                  "end_time",
                ],
                properties: {
                  class_id: { type: "string", format: "uuid" },
                  subject_id: { type: "string", format: "uuid" },
                  teacher_id: { type: "string", format: "uuid" },
                  day_of_week: {
                    type: "string",
                    enum: [
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday",
                    ],
                  },
                  start_time: { type: "string", format: "time" },
                  end_time: { type: "string", format: "time" },
                  room: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Timetable entry created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    timetable: { $ref: "#/components/schemas/Timetable" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
