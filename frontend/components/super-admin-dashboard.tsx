"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  Shield, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  Crown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Admin {
  id: string
  user_id: string
  first_name: string
  last_name: string
  phone: string
  department: string
  is_active: boolean
  created_at: string
}

interface Stats {
  totalAdmins: number
  totalTeachers: number
  totalStudents: number
  totalUsers: number
}

export function SuperAdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<Stats>({
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalUsers: 0
  })

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/super-admin/admins', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const data = await response.json()
      
      console.log('✅ Admins API response:', data)
      
      if (data.success) {
        setAdmins(data.admins)
        setStats(prev => ({ ...prev, totalAdmins: data.count }))
      } else {
        setError(data.error || 'Failed to fetch admins')
      }
    } catch (err: any) {
      console.error('❌ Error fetching admins:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const [studentsRes, teachersRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/admin/teachers')
      ])
      
      const [studentsData, teachersData] = await Promise.all([
        studentsRes.json(),
        teachersRes.json()
      ])
      
      setStats(prev => ({
        ...prev,
        totalStudents: studentsData.count || 0,
        totalTeachers: teachersData.count || 0,
        totalUsers: (studentsData.count || 0) + (teachersData.count || 0) + prev.totalAdmins
      }))
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  useEffect(() => {
    fetchAdmins()
    fetchStats()
  }, [])

  // Delete admin
  const handleDeleteAdmin = async (adminId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete admin: ${userName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/admins/${adminId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Admin deleted successfully')
        fetchAdmins()
        fetchStats()
      } else {
        alert(`Failed to delete admin: ${data.error}`)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  // Toggle admin status
  const handleToggleStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/super-admin/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchAdmins()
      } else {
        alert(`Failed to update status: ${data.error}`)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  // Filter admins
  const filteredAdmins = admins.filter(admin => {
    const query = searchQuery.toLowerCase()
    return (
      admin.first_name.toLowerCase().includes(query) ||
      admin.last_name.toLowerCase().includes(query) ||
      admin.department.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your entire school system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchAdmins(); fetchStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All system users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Active teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Management</CardTitle>
              <CardDescription>Control and manage system administrators</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins by name or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading admins...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 font-medium">No admins found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Add your first admin to get started'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.first_name} {admin.last_name}
                      </TableCell>
                      <TableCell>{admin.department || 'N/A'}</TableCell>
                      <TableCell>{admin.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(admin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(admin.user_id, admin.is_active)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {admin.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteAdmin(admin.user_id, `${admin.first_name} ${admin.last_name}`)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
