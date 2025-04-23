# Frontend Architecture

## 1. Frontend Architecture Overview

The HMS frontend is built as a modern single-page application (SPA) using:

- **React**: A JavaScript library for building user interfaces
- **TypeScript**: For type safety and better developer experience
- **React Router**: For client-side routing and navigation
- **Axios**: For HTTP requests to the backend API

The frontend follows these architectural principles:
- **Component-Based Architecture**: UI broken down into reusable components
- **Context API for State Management**: Global state managed through React Context
- **Service Layer Pattern**: API communication abstracted into service modules
- **Type-Driven Development**: Strong typing throughout the application

## 2. Project Structure

The frontend code is organized in a modular structure:

```
frontend/src/
├── assets/         # Static assets like images and icons
├── components/     # Reusable UI components
├── context/        # React Context definitions
├── pages/          # Full page components
├── services/       # API communication modules
├── styles/         # Global styles and theme definitions
├── types/          # TypeScript type definitions
├── App.tsx         # Main application component
└── index.tsx       # Application entry point
```

## 3. Routing and Navigation

The application uses React Router for client-side navigation:

```typescript
function AppContent() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  
  // Don't show navbar on login page
  const showNavbar = location.pathname !== '/login';

  return (
    <div className="app-container">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "container mt-4" : ""}>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Redirect root to login if not logged in, otherwise to dashboard */}
          <Route 
            path="/" 
            element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />

          {/* Protected routes */}
          <Route path="/patients" element={
            <ProtectedRoute>
              <PatientList />
            </ProtectedRoute>
          } />
          {/* Additional routes... */}
        </Routes>
      </main>
    </div>
  );
}
```

Key routing features:
- **Public vs. Protected Routes**: Different access patterns based on authentication
- **URL Parameters**: Dynamic routing (e.g., `/patients/:id`)
- **Nested Routes**: Hierarchical page organization

## 4. Authentication and Authorization

The frontend implements a comprehensive auth system:

### Authentication Context

```typescript
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication logic...

  const value = {
    currentUser,
    isLoggedIn: isAuthenticated(),
    userRole: currentUser?.role || null,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    hasPermission: checkPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### Protected Route Component

```typescript
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isLoggedIn, userRole, loading } = useAuth();
  const location = useLocation();

  // Check if user is logged in
  if (!isLoggedIn) {
    // Redirect to login page and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="container mt-5 text-center">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  // If user is authenticated and has the required role (if any), render the children
  return <>{children}</>;
};
```

Key authentication features:
- **JWT Token Management**: Secure storage and transmission of auth tokens
- **Role-Based Access Control**: Different UIs based on user role
- **Permission Checking**: Granular access controls within pages
- **Auto-Redirect**: Unauthenticated users redirected to login

## 5. Service Layer

The frontend uses a service layer pattern to abstract API communication:

```typescript
// Example patient service implementation
export const getPatients = async (page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Patient>> => {
  try {
    // Use the actual API endpoint
    const response = await axios.get(`${API_URL}?page=${page}&per_page=${perPage}`);
    const paginatedResponse: PaginatedResponse<Patient> = response.data;
    
    // Additional processing...
    
    return paginatedResponse;
  } catch (error) {
    console.error('Error fetching patients from API:', error);
    // Error handling...
  }
};
```

Key service layer features:
- **API Abstraction**: Isolates API details from UI components
- **Error Handling**: Centralized error management
- **Type Safety**: Strongly typed request and response handling
- **Token Management**: Automatic inclusion of auth tokens in requests

## 6. State Management

The application uses a combination of state management approaches:

- **React Context API**: For global application state (auth, theme, etc.)
- **Local Component State**: For component-specific UI state
- **URL Parameters**: For state that should be persisted in the URL

### Context Implementation

```typescript
// Auth context example
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 7. Component Architecture

The UI is built using a hierarchical component structure:

- **Layout Components**: Navbar, Sidebar, Page containers
- **Page Components**: Full pages like PatientList, Dashboard
- **Feature Components**: Form components, data tables, cards
- **UI Components**: Buttons, inputs, modals, alerts

### Component Design Principles

- **Single Responsibility**: Each component has a specific purpose
- **Composition**: Complex UIs assembled from simple components
- **Reusability**: Common patterns abstracted into reusable components
- **Prop Typing**: Strong TypeScript types for component properties

## 8. Data Flow Management

The application follows a unidirectional data flow:

1. **User Interaction**: User interacts with a component
2. **Event Handling**: Component handles the event
3. **Service Call**: Service module makes API request
4. **State Update**: Context or component state is updated
5. **Re-render**: Components re-render with new data

### Example Data Flow

```
User clicks "Create Patient" → 
PatientForm collects data → 
patientService.createPatient() sends data to API → 
On success, redirect to patient list → 
PatientList component fetches updated list → 
User sees newly created patient
```

## 9. UI/UX Design Patterns

The frontend implements modern UI/UX patterns:

- **Responsive Design**: Adapts to different screen sizes
- **Progressive Disclosure**: Complex features revealed progressively
- **Consistent Navigation**: Predictable navigation patterns
- **Form Validation**: Immediate feedback on user input
- **Loading States**: Clear indication of background processes
- **Error Handling**: User-friendly error messages

## 10. Code Organization Best Practices

The codebase follows these best practices:

- **Feature-Based Organization**: Code organized by feature, not technology
- **Separation of Concerns**: UI logic separate from business logic
- **DRY (Don't Repeat Yourself)**: Common code extracted to reusable modules
- **SOLID Principles**: Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion
- **Clean Code**: Descriptive naming, consistent formatting, efficient algorithms

This frontend architecture provides a maintainable, scalable foundation for the Healthcare Management System, with a focus on user experience, performance, and developer productivity.
