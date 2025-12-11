# API Documentation with Swagger

This project uses Swagger/OpenAPI for comprehensive API documentation.

## Accessing the Documentation

Once the development server is running, you can access the interactive API documentation at:

**Local Development:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Features

- **Interactive API Testing**: Test all API endpoints directly from the browser
- **Request/Response Schemas**: View detailed schemas for all data models
- **Authentication Support**: Test authenticated endpoints
- **Tag-based Organization**: APIs organized by functional areas (Students, Teachers, Classes, etc.)

## Available API Endpoints

The documentation includes the following endpoint categories:

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create a new student
- Additional student-related endpoints

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create a new subject

### Attendance
- `GET /api/attendance` - Get attendance records (with filters)
- `POST /api/attendance` - Record attendance

### Grades
- `GET /api/grades` - Get grade records (with filters)
- `POST /api/grades` - Create a new grade record

### Timetable
- `GET /api/timetable` - Get timetable entries (with filters)
- `POST /api/timetable` - Create a new timetable entry

## Updating Documentation

The Swagger configuration is located in:
- **Configuration**: `frontend/lib/swagger.ts`
- **API Endpoint**: `frontend/app/api/swagger/route.ts`
- **UI Page**: `frontend/app/api-docs/page.tsx`

### Adding New Endpoints

To document a new API endpoint:

1. Open `frontend/lib/swagger.ts`
2. Add your endpoint to the `paths` object following the OpenAPI 3.0 specification
3. If you have new data models, add them to the `components.schemas` object
4. The documentation will automatically update when you save

### Example: Adding a New Endpoint

```typescript
'/api/your-endpoint': {
  get: {
    tags: ['YourTag'],
    summary: 'Brief description',
    description: 'Detailed description',
    responses: {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: { type: 'array', items: { $ref: '#/components/schemas/YourModel' } },
              },
            },
          },
        },
      },
    },
  },
},
```

## Data Models

All data models (schemas) are defined in the `components.schemas` section of the Swagger configuration. Current models include:

- **Student**: Complete student information
- **Subject**: Subject/course details
- **Class**: Class information
- **Attendance**: Attendance records
- **Grade**: Grade/assessment records
- **Timetable**: Schedule entries

## Development

The Swagger UI is loaded dynamically on the client side to avoid SSR issues with Next.js. The configuration is served as JSON from the `/api/swagger` endpoint.

### Technologies Used

- **swagger-ui-react**: Interactive API documentation UI
- **openapi-types**: TypeScript types for OpenAPI 3.0 specifications

## Best Practices

1. **Keep Documentation Updated**: Update Swagger definitions when you modify API endpoints
2. **Use Descriptive Names**: Provide clear summaries and descriptions for all endpoints
3. **Define Schemas**: Create reusable schemas for complex data structures
4. **Add Examples**: Include example requests and responses where helpful
5. **Document Parameters**: Clearly describe all query parameters, path parameters, and request bodies

## Troubleshooting

### Swagger UI Not Loading

If the Swagger UI doesn't load:
1. Check that the dev server is running
2. Verify `/api/swagger` returns valid JSON
3. Check browser console for errors

### Documentation Not Updating

If changes to `swagger.ts` don't appear:
1. Clear your browser cache
2. Restart the development server
3. Check for syntax errors in the OpenAPI definition
