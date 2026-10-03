import { createServerFn } from "@tanstack/react-start";
import type { VideoChatMessage } from "./videoChatStore.server";

export type { VideoChatMessage };

export type VideoChatResult = {
  status: "ok" | "error";
  messages: VideoChatMessage[];
  count: number;
  message?: string;
};

export const fetchVideoChatMessagesServer = createServerFn({ method: "GET" })
  .validator((input: { courseId?: string; lessonId?: string } | undefined) => ({
    courseId: String(input?.courseId ?? "").trim(),
    lessonId: String(input?.lessonId ?? "").trim(),
  }))
  .handler(async ({ data }): Promise<VideoChatResult> => {
    try {
      if (!data.courseId || !data.lessonId) {
        return {
          status: "error",
          messages: [],
          count: 0,
          message: "Course ID and Lesson ID are required.",
        };
      }

      const { getLessonChat } = await import("./videoChatStore.server");
      const messages = getLessonChat(data.courseId, data.lessonId);
      return {
        status: "ok",
        messages,
        count: messages.length,
      };
    } catch (err) {
      console.error("fetchVideoChatMessagesServer error:", err);
      return {
        status: "error",
        messages: [],
        count: 0,
        message: err instanceof Error ? err.message : "Failed to load messages",
      };
    }
  });

export const sendVideoChatMessageServer = createServerFn({ method: "POST" })
  .validator(
    (
      input:
        | {
            courseId?: string;
            lessonId?: string;
            userId?: string;
            userName?: string;
            userRole?: "student" | "admin" | "instructor";
            userAvatar?: string | null;
            text?: string;
            isQuestion?: boolean;
            timestampSeconds?: number | null;
          }
        | undefined,
    ) => ({
      courseId: String(input?.courseId ?? "").trim(),
      lessonId: String(input?.lessonId ?? "").trim(),
      userId: String(input?.userId ?? "").trim(),
      userName: String(input?.userName ?? "").trim(),
      userRole: (input?.userRole ?? "student") as "student" | "admin" | "instructor",
      userAvatar: input?.userAvatar ? String(input.userAvatar) : null,
      text: String(input?.text ?? "").trim(),
      isQuestion: Boolean(input?.isQuestion),
      timestampSeconds: typeof input?.timestampSeconds === "number" ? input.timestampSeconds : null,
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean;
      message?: VideoChatMessage;
      error?: string;
    }> => {
      try {
        if (!data.courseId || !data.lessonId) {
          return { success: false, error: "Course and lesson are required" };
        }
        if (!data.text || data.text.length < 1) {
          return { success: false, error: "Please enter a message" };
        }
        if (data.text.length > 1000) {
          return { success: false, error: "Message cannot exceed 1000 characters" };
        }

        const { addLessonChatMessage } = await import("./videoChatStore.server");
        const newMsg = addLessonChatMessage({
          courseId: data.courseId,
          lessonId: data.lessonId,
          userId: data.userId || `student_${Date.now()}`,
          userName: data.userName || "Student",
          userRole: data.userRole,
          userAvatar: data.userAvatar,
          text: data.text,
          isQuestion: data.isQuestion,
          timestampSeconds: data.timestampSeconds,
        });

        return {
          success: true,
          message: newMsg,
        };
      } catch (err) {
        console.error("sendVideoChatMessageServer error:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to send message",
        };
      }
    },
  );

export const reactToVideoChatMessageServer = createServerFn({ method: "POST" })
  .validator(
    (
      input:
        | {
            courseId?: string;
            lessonId?: string;
            messageId?: string;
            userId?: string;
            reaction?: string;
          }
        | undefined,
    ) => ({
      courseId: String(input?.courseId ?? "").trim(),
      lessonId: String(input?.lessonId ?? "").trim(),
      messageId: String(input?.messageId ?? "").trim(),
      userId: String(input?.userId ?? "").trim(),
      reaction: String(input?.reaction ?? "👍").trim(),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean;
      reactions?: Record<string, string[]>;
      error?: string;
    }> => {
      try {
        if (!data.courseId || !data.lessonId || !data.messageId || !data.userId) {
          return { success: false, error: "Invalid reaction parameters" };
        }
        const { toggleMessageReaction } = await import("./videoChatStore.server");
        const res = toggleMessageReaction({
          courseId: data.courseId,
          lessonId: data.lessonId,
          messageId: data.messageId,
          userId: data.userId,
          reaction: data.reaction,
        });
        return res;
      } catch (err) {
        console.error("reactToVideoChatMessageServer error:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to react",
        };
      }
    },
  );

export const deleteVideoChatMessageServer = createServerFn({ method: "POST" })
  .validator(
    (
      input:
        | {
            courseId?: string;
            lessonId?: string;
            messageId?: string;
            userId?: string;
            isAdmin?: boolean;
          }
        | undefined,
    ) => ({
      courseId: String(input?.courseId ?? "").trim(),
      lessonId: String(input?.lessonId ?? "").trim(),
      messageId: String(input?.messageId ?? "").trim(),
      userId: String(input?.userId ?? "").trim(),
      isAdmin: Boolean(input?.isAdmin),
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!data.courseId || !data.lessonId || !data.messageId) {
        return { success: false, error: "Invalid message deletion request" };
      }
      const { deleteLessonChatMessage } = await import("./videoChatStore.server");
      const deleted = deleteLessonChatMessage({
        courseId: data.courseId,
        lessonId: data.lessonId,
        messageId: data.messageId,
        userId: data.userId,
        isAdmin: data.isAdmin,
      });
      return { success: deleted };
    } catch (err) {
      console.error("deleteVideoChatMessageServer error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete message",
      };
    }
  });
