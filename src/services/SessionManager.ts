// src/services/session.service.ts
import {
  Session,
  LeaderboardEntry,
  Question,
  Participant,
} from '../types/types';

class SessionService {
  private sessions = new Map<string, Session>();

  createSession(questions: Question[]): string {
    const roomId = this.generateRoomId();
    this.sessions.set(roomId, {
      roomId,
      participants: new Map(),
      questions,
      currentQuestionIndex: -1,
      leaderboard: [],
      isActive: false,
      createdAt: Date.now(),
    });
    return roomId;
  }

  joinSession(roomId: string, participant: Participant): Session {
    const session = this.getSession(roomId);
    session.participants.set(participant.socketId, participant);
    return session;
  }

  submitAnswer(
    roomId: string,
    username: string,
    answer: string
  ): LeaderboardEntry[] {
    try {
      const session = this.getSession(roomId);
      const question = session.questions[session.currentQuestionIndex];
      const participant = session.participants.get(username);
      if (question && participant && answer === question.correctAnswer) {
        participant.score += question.points;
        this.updateLeaderboard(session);
      }

      return session.leaderboard;
    } catch (e) {
      console.error('Error submitting answer:', (e as Error).message);
      return [];
    }
  }

  getSession(roomId: string): Session {
    const session = this.sessions.get(roomId);

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  endSession(roomId: string): void {
    if (this.sessions.has(roomId)) {
      this.sessions.delete(roomId);
    }
  }

  cleanupInactiveSessions(): void {
    const now = Date.now();
    this.sessions.forEach((session, roomId) => {
      if (!session.isActive && now - session.createdAt > 3600000) {
        // 1 hour
        this.sessions.delete(roomId);
      }
    });
  }

  private updateLeaderboard(session: Session) {
    session.leaderboard = Array.from(session.participants.values())
      .sort((a, b) => b.score - a.score)
      .map((p) => ({ name: p.name, score: p.score }));
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Other methods...
}

export const sessionService = new SessionService();
