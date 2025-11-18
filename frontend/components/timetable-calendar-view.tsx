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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, RefreshCw, AlertCircle, Clock, X, Edit } from "lucide-react";

interface TimetableEntry {
  id: string;
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  room_number: string;
  class_type: string;
  section: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  join_code: string;
  enrolled_count: number;
}

interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Generate time slots from 7 AM to 5 PM
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 7; hour <= 17; hour++) {
    const start = `${hour.toString().padStart(2, "0")}:00`;
    const end = `${(hour + 1).toString().padStart(2, "0")}:00`;
    const label = `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "PM" : "AM"}-${
      hour + 1 > 12 ? hour + 1 - 12 : hour + 1
    }${hour + 1 >= 12 ? "PM" : "AM"}`;
    slots.push({ start, end, label });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function TimetableCalendarView() {
  const [loading, setLoading] = useState(false);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    day: string;
    time: TimeSlot;
  } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [selectedSection, setSelectedSection] = useState("M1");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    subject_id: "",
    teacher_id: "",
    room_number: "",
    class_type: "lecture",
    semester: "Fall 2024",
  });

  useEffect(() => {
    fetchTimetable();
    fetchSubjects();
    fetchTeachers();
  }, [academicYear, selectedSection]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/subject-classes?academic_year=${academicYear}`
      );
      const data = await response.json();
      if (data.success) {
        // Filter by section
        const filtered = data.classes.filter(
          (c: any) => c.section === selectedSection
        );
        setTimetableData(filtered);
      }
    } catch (err) {
      console.error("Error fetching timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/subjects");
      const data = await response.json();
      if (data.success) setSubjects(data.subjects || []);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/admin/teachers");
      const data = await response.json();
      if (data.success) setTeachers(data.teachers || []);
    } catch (err) {
      console.error("Error fetching teachers:", err);
    }
  };

  const getClassTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lecture: "bg-blue-500/20 text-blue-200 border-blue-500/30",
      practice: "bg-green-500/20 text-green-200 border-green-500/30",
      lab: "bg-purple-500/20 text-purple-200 border-purple-500/30",
      tutorial: "bg-orange-500/20 text-orange-200 border-orange-500/30",
    };
    return colors[type] || "bg-gray-500/20 text-gray-200 border-gray-500/30";
  };

  const getEntriesForSlot = (day: string, slot: TimeSlot) => {
    return timetableData.filter((entry) => {
      if (entry.day_of_week !== day) return false;

      const entryStart = entry.start_time.substring(0, 5);
      const entryEnd = entry.end_time.substring(0, 5);
      const slotStart = slot.start;
      const slotEnd = slot.end;

      // Check if entry overlaps with this time slot
      return entryStart < slotEnd && entryEnd > slotStart;
    });
  };

  const handleCellClick = (day: string, slot: TimeSlot) => {
    setSelectedCell({ day, time: slot });
    setFormData({
      subject_id: "",
      teacher_id: "",
      room_number: "",
      class_type: "lecture",
      semester: "Fall 2024",
    });
    setCreateDialogOpen(true);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/subject-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          day_of_week: selectedCell.day,
          start_time: selectedCell.time.start,
          end_time: selectedCell.time.end,
          section: selectedSection,
          academic_year: academicYear,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Schedule created! Join Code: ${data.class.join_code}`);
        setCreateDialogOpen(false);
        fetchTimetable();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to create schedule");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Timetable Calendar View</CardTitle>
              <CardDescription>
                Click on a time slot to add a class
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchTimetable}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g., 2024-2025"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Class Section</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="M1">M1 (Morning - 7AM-5PM)</option>
                <option value="M2">M2 (Morning - 7AM-5PM)</option>
                <option value="A1">A1 (Afternoon)</option>
                <option value="A2">A2 (Afternoon)</option>
                <option value="E1">E1 (Evening)</option>
                <option value="E2">E2 (Evening)</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={getClassTypeColor("lecture")}>Lecture</Badge>
            <Badge className={getClassTypeColor("practice")}>Practice</Badge>
            <Badge className={getClassTypeColor("lab")}>Lab</Badge>
            <Badge className={getClassTypeColor("tutorial")}>Tutorial</Badge>
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

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-2 text-left w-32 sticky left-0 bg-muted z-10">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Time
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="border p-2 text-center min-w-[150px]"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-background" : "bg-muted/50"}
                  >
                    <td className="border p-2 text-sm font-medium sticky left-0 bg-inherit z-10">
                      {slot.label}
                    </td>
                    {DAYS.map((day) => {
                      const entries = getEntriesForSlot(day, slot);
                      return (
                        <td
                          key={day}
                          className="border p-1 cursor-pointer hover:bg-accent/50 transition-colors relative group"
                          onClick={() =>
                            entries.length === 0 && handleCellClick(day, slot)
                          }
                        >
                          {entries.length === 0 ? (
                            <div className="h-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {entries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className={`p-2 rounded border text-xs ${getClassTypeColor(
                                    entry.class_type
                                  )}`}
                                >
                                  <div className="font-semibold">
                                    {entry.subject_code}
                                  </div>
                                  <div className="text-[10px] opacity-80">
                                    {entry.teacher_name}
                                  </div>
                                  <div className="text-[10px] opacity-80">
                                    Room {entry.room_number}
                                  </div>
                                  <div className="text-[10px] mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0"
                                    >
                                      {entry.join_code}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Class - {selectedCell?.day} ({selectedCell?.time.label})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSchedule} className="space-y-4">
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
                    {t.first_name} {t.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class Type *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.class_type}
                  onChange={(e) =>
                    setFormData({ ...formData, class_type: e.target.value })
                  }
                >
                  <option value="lecture">Lecture</option>
                  <option value="practice">Practice</option>
                  <option value="lab">Lab</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Room Number *</label>
                <Input
                  placeholder="e.g., 302"
                  value={formData.room_number}
                  onChange={(e) =>
                    setFormData({ ...formData, room_number: e.target.value })
                  }
                  required
                />
              </div>
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

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Schedule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
