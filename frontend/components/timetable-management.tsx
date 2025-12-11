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
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimeSlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  academic_year: string;
  is_active: boolean;
}

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
  credit_hours: number;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  teacher_code: string;
}

interface Class {
  id: string;
  class_name: string;
  section: string;
}

interface SubjectClass {
  id: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  teacher_id: string;
  teacher_name?: string;
  class_id?: string;
  class_name?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number: string;
  class_type: string;
  section: string;
  academic_year: string;
  semester: string;
  join_code: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const CLASS_TYPES = ["lecture", "practice", "lab", "tutorial"];

export function TimetableManagement() {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjectClasses, setSubjectClasses] = useState<SubjectClass[]>([]);
  const [academicYear, setAcademicYear] = useState("2024-2025");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SubjectClass | null>(null);

  // Form state
  // Conflict detection
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  const [formData, setFormData] = useState({
    subject_id: "",
    teacher_id: "",
    class_id: "",
    day_of_week: "Monday",
    start_time: "07:00",
    end_time: "08:00",
    room_number: "",
    class_type: "lecture",
    section: "",
    academic_year: "2024-2025",
    semester: "Fall 2024",
  });

  const [error, setError] = useState("");

  const checkConflicts = async (data: any) => {
    setCheckingConflicts(true);
    setConflicts([]);
    try {
      const response = await fetch("/api/timetable/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_class_id: selectedItem?.id,
          teacher_id: data.teacher_id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          room_number: data.room_number,
          academic_year: data.academic_year,
        }),
      });

      const result = await response.json();
      if (result.success && result.conflicts) {
        setConflicts(result.conflicts);
        return result.has_conflicts;
      }
      return false;
    } catch (err) {
      console.error("Error checking conflicts:", err);
      return false;
    } finally {
      setCheckingConflicts(false);
    }
  };

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, [academicYear]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSubjects(),
        fetchTeachers(),
        fetchClasses(),
        fetchSubjectClasses(),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/subjects");
      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/admin/teachers");
      const data = await response.json();
      if (data.success) {
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error("Error fetching teachers:", err);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchSubjectClasses = async () => {
    try {
      const response = await fetch(
        `/api/subject-classes?academic_year=${academicYear}`
      );
      const data = await response.json();
      if (data.success) {
        setSubjectClasses(data.classes || []);
      }
    } catch (err) {
      console.error("Error fetching subject classes:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Check for conflicts first
    const hasConflicts = await checkConflicts({
      ...formData,
      academic_year: academicYear,
    });
    const criticalConflicts = conflicts.filter(
      (c) => c.severity === "critical"
    );

    if (hasConflicts && criticalConflicts.length > 0) {
      setError(
        "Cannot create schedule due to critical conflicts. Please resolve them first."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/subject-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setCreateDialogOpen(false);
        resetForm();
        setConflicts([]);
        fetchSubjectClasses();
        alert(`Group created successfully! Join Code: ${data.class.join_code}`);
      } else {
        setError(data.error || "Failed to create group");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setLoading(true);
    setError("");

    // Check for conflicts first
    const hasConflicts = await checkConflicts({
      ...formData,
      academic_year: academicYear,
    });
    const criticalConflicts = conflicts.filter(
      (c) => c.severity === "critical"
    );

    if (hasConflicts && criticalConflicts.length > 0) {
      setError(
        "Cannot update schedule due to critical conflicts. Please resolve them first."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/subject-classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditDialogOpen(false);
        setSelectedItem(null);
        resetForm();
        setConflicts([]);
        fetchSubjectClasses();
        alert("Class updated successfully!");
      } else {
        setError(data.error || "Failed to update class");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timetable entry?"))
      return;

    setLoading(true);
    try {
      const response = await fetch(`/api/subject-classes?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchSubjectClasses();
        alert("Timetable entry deleted successfully");
      } else {
        alert(data.error || "Failed to delete entry");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject_id: "",
      teacher_id: "",
      class_id: "",
      day_of_week: "Monday",
      start_time: "07:00",
      end_time: "08:00",
      room_number: "",
      class_type: "lecture",
      section: "",
      academic_year: academicYear,
      semester: "Fall 2024",
    });
  };

  const openEditDialog = (item: SubjectClass) => {
    setSelectedItem(item);
    setFormData({
      subject_id: item.subject_id,
      teacher_id: item.teacher_id,
      class_id: item.class_id || "",
      day_of_week: item.day_of_week,
      start_time: item.start_time,
      end_time: item.end_time,
      room_number: item.room_number,
      class_type: item.class_type,
      section: item.section,
      academic_year: item.academic_year,
      semester: item.semester,
    });
    setEditDialogOpen(true);
  };

  // Group classes by day
  const classesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = subjectClasses
      .filter((c) => c.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return acc;
  }, {} as Record<string, SubjectClass[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Timetable Management</CardTitle>
              <CardDescription>
                Create and manage group schedules for {academicYear}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchAllData}
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
                Create Schedule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Academic Year</label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g., 2024-2025"
              />
            </div>
            <div className="flex gap-2 pt-6">
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {subjectClasses.length} Schedules
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Timetable Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading timetable...</p>
          </CardContent>
        </Card>
      ) : subjectClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No schedules found for {academicYear}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {DAYS_OF_WEEK.map((day) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-lg">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                {classesByDay[day].length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No classes scheduled
                  </p>
                ) : (
                  <div className="space-y-2">
                    {classesByDay[day].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">
                              {item.subject_name || "Subject"}
                            </h4>
                            <Badge variant="outline">{item.section}</Badge>
                            <Badge variant="secondary">{item.class_type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.start_time} - {item.end_time}
                            </span>
                            <span>
                              Teacher: {item.teacher_name || "Not assigned"}
                            </span>
                            <span>Room: {item.room_number}</span>
                            <span>
                              Code:{" "}
                              <code className="text-xs bg-muted px-1 rounded">
                                {item.join_code}
                              </code>
                            </span>
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
                                setSelectedItem(item);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.subject_id}
                  onChange={(e) =>
                    setFormData({ ...formData, subject_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject_name} ({s.subject_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Teacher *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.teacher_id}
                  onChange={(e) =>
                    setFormData({ ...formData, teacher_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} ({t.teacher_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Day of Week *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.day_of_week}
                  onChange={(e) =>
                    setFormData({ ...formData, day_of_week: e.target.value })
                  }
                  required
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Class Type *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.class_type}
                  onChange={(e) =>
                    setFormData({ ...formData, class_type: e.target.value })
                  }
                  required
                >
                  {CLASS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time *</label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time *</label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Section *</label>
                <Input
                  placeholder="e.g., M1, A2, E3"
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Room Number *</label>
                <Input
                  placeholder="e.g., Room 301"
                  value={formData.room_number}
                  onChange={(e) =>
                    setFormData({ ...formData, room_number: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <Input
                  placeholder="e.g., Fall 2024"
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Conflict Warnings */}
            {checkingConflicts && (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertDescription>Checking for conflicts...</AlertDescription>
              </Alert>
            )}

            {conflicts.length > 0 && (
              <div className="space-y-2">
                {conflicts.map((conflict, index) => (
                  <Alert
                    key={index}
                    variant={
                      conflict.severity === "critical"
                        ? "destructive"
                        : "default"
                    }
                    className={
                      conflict.severity === "info"
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>
                        {conflict.type.replace(/_/g, " ").toUpperCase()}
                      </strong>
                      : {conflict.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                  setConflicts([]);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  checkConflicts({ ...formData, academic_year: academicYear })
                }
                disabled={checkingConflicts}
              >
                Check Conflicts
              </Button>
              <Button
                type="submit"
                disabled={
                  loading || conflicts.some((c) => c.severity === "critical")
                }
              >
                {loading ? "Creating..." : "Create Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Subject
                </p>
                <p>
                  {selectedItem.subject_name} ({selectedItem.subject_code})
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Teacher
                </p>
                <p>{selectedItem.teacher_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Schedule
                </p>
                <p>
                  {selectedItem.day_of_week}, {selectedItem.start_time} -{" "}
                  {selectedItem.end_time}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Location
                </p>
                <p>Room {selectedItem.room_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Class Details
                </p>
                <p>
                  Section: {selectedItem.section} | Type:{" "}
                  {selectedItem.class_type}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Join Code
                </p>
                <code className="bg-muted px-2 py-1 rounded">
                  {selectedItem.join_code}
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Academic Info
                </p>
                <p>
                  {selectedItem.academic_year} - {selectedItem.semester}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.subject_id}
                  onChange={(e) =>
                    setFormData({ ...formData, subject_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject_name} ({s.subject_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Teacher *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.teacher_id}
                  onChange={(e) =>
                    setFormData({ ...formData, teacher_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} ({t.teacher_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Day of Week *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.day_of_week}
                  onChange={(e) =>
                    setFormData({ ...formData, day_of_week: e.target.value })
                  }
                  required
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Class Type *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.class_type}
                  onChange={(e) =>
                    setFormData({ ...formData, class_type: e.target.value })
                  }
                  required
                >
                  {CLASS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time *</label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time *</label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Section *</label>
                <Input
                  placeholder="e.g., M1, A2, E3"
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Room Number *</label>
                <Input
                  placeholder="e.g., Room 301"
                  value={formData.room_number}
                  onChange={(e) =>
                    setFormData({ ...formData, room_number: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <Input
                  placeholder="e.g., Fall 2024"
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedItem(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
