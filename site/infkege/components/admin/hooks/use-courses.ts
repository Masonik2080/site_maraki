"use client";

import { useState, useEffect, useCallback } from "react";
import type { CourseDTO } from "@/lib/data";

export function useCourses() {
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCourses(data);
      setError(null);
    } catch (e) {
      setError("Не удалось загрузить курсы");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}

export function useCourse(slug: string | null) {
  const [course, setCourse] = useState<CourseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCourse(data);
      setError(null);
    } catch (e) {
      setError("Не удалось загрузить курс");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  return { course, loading, error, refetch: fetchCourse };
}

export function useCreateCourse() {
  const [creating, setCreating] = useState(false);

  const create = useCallback(async (data: { title: string; slug: string }) => {
    try {
      setCreating(true);
      const res = await fetch("/api/admin/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return true;
    } catch (e) {
      return false;
    } finally {
      setCreating(false);
    }
  }, []);

  return { create, creating };
}

export function useSaveLesson() {
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (slug: string, lessonId: string, contentBlocks: any[]) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/courses/${slug}/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentBlocks }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return true;
    } catch (e) {
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { save, saving };
}
