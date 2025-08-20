import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom'
import Login from '@/pages/Auth/Login'
import SignUp from '@/pages/Auth/SignUp'
import ManageUsers from '@/pages/Admin/ManageUsers'
import ManageTasks from '@/pages/Admin/ManageTasks'
import CreateTask from '@/pages/Admin/CreateTask'
import Dashboard from '@/pages/Admin/Dashboard'
import UserDashboard from '@/pages/users/UserDashboard'
import MyTasks from '@/pages/users/MyTasks'
import PrivateRoute from '@/routes/PrivateRoute'
import ViewTaskDetails from '@/pages/users/ViewtaskDetails'
const App = () => {
  
  return (
    <div>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login/>} />
          <Route path="/signUp" element={<SignUp/>} />
          {/* Admin routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']}/>} >
          <Route path="/admin/dashboard" element={<Dashboard/>} />
          <Route path="/admin/create-task" element={<CreateTask/>} />
          <Route path="/admin/tasks" element={<ManageTasks/>} />
          <Route path="/admin/users" element={<ManageUsers/>} />
          </Route>
          {/* user routes */}
          <Route element={<PrivateRoute allowedRoles={['admin','user']}/>} >
          <Route path="/user/user-dashboard" element={<UserDashboard/>} />
          <Route path="/user/tasks" element={<MyTasks/>} />
          <Route path="/user/view-task/:taskId" element={<ViewTaskDetails/>} />
          </Route>

        </Routes>
      </Router>
    </div>
  )
}

export default App