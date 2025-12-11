"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
  description?: string;
  credit_hours: number;
  is_active: boolean;
  created_at: string;
}

export function SubjectManagement() {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    subject_name: "",
    subject_code: "",
    description: "",
    credit_hours: "3",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subjects");
      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          credit_hours: parseInt(formData.credit_hours),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Subject created successfully!");
        setCreateDialogOpen(false);
        resetForm();
        fetchSubjects();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to create subject");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSubject.id,
          ...formData,
          credit_hours: parseInt(formData.credit_hours),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Subject updated successfully!");
        setEditDialogOpen(false);
        setSelectedSubject(null);
        resetForm();
        fetchSubjects();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update subject");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this subject? This will affect all related schedules."
      )
    )
      return;

    setLoading(true);
    try {
      const response = await fetch(`/api/subjects?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Subject deleted successfully!");
        fetchSubjects();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to delete subject");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject_name: "",
      subject_code: "",
      description: "",
      credit_hours: "3",
    });
  };

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      subject_name: subject.subject_name,
      subject_code: subject.subject_code,
      description: subject.description || "",
      credit_hours: subject.credit_hours.toString(),
    });
    setEditDialogOpen(true);
  };

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.subject_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course Management</CardTitle>
              <CardDescription>
                Create and manage courses for your school
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchSubjects}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Course
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by name or code..."
                className="pl-9"
              />
            </div>
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3" />
              {subjects.length} Courses
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-900">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Subjects List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading courses...</p>
          </CardContent>
        </Card>
      ) : filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No courses found matching your search"
                : "No courses found"}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <Card
              key={subject.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {subject.subject_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {subject.subject_code}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {subject.credit_hours}{" "}
                        {subject.credit_hours === 1 ? "hour" : "hours"}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedSubject(subject);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(subject)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(subject.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              {subject.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subject.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course Name *</label>
              <Input
                placeholder="e.g., Mathematics"
                value={formData.subject_name}
                onChange={(e) =>
                  setFormData({ ...formData, subject_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Course Code *</label>
              <Input
                placeholder="e.g., MATH101"
                value={formData.subject_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subject_code: e.target.value.toUpperCase(),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Hours *</label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 3"
                value={formData.credit_hours}
                onChange={(e) =>
                  setFormData({ ...formData, credit_hours: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Course Name
                </p>
                <p className="text-base">{selectedSubject.subject_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Course Code
                </p>
                <p className="text-base font-mono">
                  {selectedSubject.subject_code}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Credit Hours
                </p>
                <p className="text-base">
                  {selectedSubject.credit_hours} hours per week
                </p>
              </div>
              {selectedSubject.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Description
                  </p>
                  <p className="text-base">{selectedSubject.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-base">
                  {new Date(selectedSubject.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course Name *</label>
              <Input
                placeholder="e.g., Mathematics"
                value={formData.subject_name}
                onChange={(e) =>
                  setFormData({ ...formData, subject_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Course Code *</label>
              <Input
                placeholder="e.g., MATH101"
                value={formData.subject_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subject_code: e.target.value.toUpperCase(),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Hours *</label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 3"
                value={formData.credit_hours}
                onChange={(e) =>
                  setFormData({ ...formData, credit_hours: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedSubject(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
