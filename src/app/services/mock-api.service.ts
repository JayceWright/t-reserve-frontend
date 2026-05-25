import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Booking, LockResponse } from '../models/booking';
import { EventItem, VenueSeatTemplate } from '../models/event';
import { Seat } from '../models/seat';
import { AuthResponse, User } from '../models/user';
import { Venue } from '../models/venue';

interface SeatLock {
  lockId: number;
  eventId: number;
  seatId: number;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class MockApiService {
  private currentUser: User | null = null;
  private lockIdCounter = 100;
  private bookings: Booking[] = [];
  private locks: SeatLock[] = [];
  private readonly venueTemplate: VenueSeatTemplate[] = this.createVenueTemplate();
  
  private events: EventItem[] = [
    {
      id: 1,
      title: 'Анна Каренина',
      description: 'Тонкая сценическая версия романа с живой музыкой, глубоким светом и камерной драматургией.',
      venue: { id: 1, name: 'Дом Актера', address: 'ул. Ленина, д. 15' },
      imageUrl: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?auto=format&fit=crop&w=1400&q=80',
      category: 'Спектакль',
      ageRestriction: '16+',
      startTime: '2026-06-15T19:00:00',
      basePrice: 800
    },
    {
      id: 2,
      title: 'Мцыри',
      description: 'Пластический спектакль о свободе, пути и внутреннем выборе на темной сцене.',
      venue: { id: 2, name: 'Новая драма', address: 'ул. Пушкина, д. 24' },
      imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80',
      category: 'Спектакль',
      ageRestriction: '12+',
      startTime: '2026-06-25T19:00:00',
      basePrice: 700
    },
    {
      id: 3,
      title: 'Аватар Live',
      description: 'Большой мультимедийный концерт с проекциями, электроникой и оркестровыми аранжировками.',
      venue: { id: 3, name: 'Городской концертный зал', address: 'пл. Свободы, д. 2' },
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80',
      category: 'Концерт',
      ageRestriction: '6+',
      startTime: '2026-06-28T18:30:00',
      basePrice: 1200
    },
    {
      id: 4,
      title: 'Концерт X',
      description: 'Инди-программа с акцентом на атмосферный свет и близкую посадку к сцене.',
      venue: { id: 4, name: 'Лофт Сцена', address: 'пер. Фабричный, д. 8' },
      imageUrl: 'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1400&q=80',
      category: 'Концерт',
      ageRestriction: '18+',
      startTime: '2026-07-02T20:00:00',
      basePrice: 1100
    },
    {
      id: 5,
      title: 'Спектакль X',
      description: 'Ироничная постановка с короткими актами, акцентом на актерскую игру и ритм диалогов.',
      venue: { id: 5, name: 'Малая сцена', address: 'ул. Чехова, д. 3' },
      imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1400&q=80',
      category: 'Спектакль',
      ageRestriction: '16+',
      startTime: '2026-07-05T19:00:00',
      basePrice: 900
    },
    {
      id: 6,
      title: 'Концерт камерного оркестра',
      description: 'Нежная акустическая программа с барочным настроением и мягкой посадкой света.',
      venue: { id: 6, name: 'Белый зал', address: 'Набережная р. Мойки, д. 12' },
      imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1400&q=80',
      category: 'Концерт',
      ageRestriction: '6+',
      startTime: '2026-07-12T18:00:00',
      basePrice: 1000
    }
  ];

  private readonly seatsByEvent: Record<number, Seat[]> = this.buildSeatsByEvent();

  private venues: Venue[] = [
    { id: 1, name: 'Дом Актера', seatsCount: 28 },
    { id: 2, name: 'Новая драма', seatsCount: 28 },
    { id: 3, name: 'Городской концертный зал', seatsCount: 28 },
    { id: 4, name: 'Лофт Сцена', seatsCount: 28 },
    { id: 5, name: 'Малая сцена', seatsCount: 28 },
    { id: 6, name: 'Белый зал', seatsCount: 28 },
  ];

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    const isMockAdmin = credentials.email.includes('admin');
    this.currentUser = {
      id: 1,
      email: credentials.email,
      name: isMockAdmin ? 'Администратор (Mock)' : 'Пользователь (Mock)',
      role: isMockAdmin ? 'ADMIN' : 'USER',
    };

    return of(this.buildAuthResponse(this.currentUser)).pipe(delay(0));
  }

  register(userData: { email: string; password: string; name: string }): Observable<AuthResponse> {
    this.currentUser = {
      id: Date.now(),
      email: userData.email,
      name: userData.name,
      role: 'USER',
    };

    return of(this.buildAuthResponse(this.currentUser)).pipe(delay(0));
  }

  refresh(): Observable<AuthResponse> {
    const user =
      this.currentUser ??
      ({
        id: 1,
        email: 'user@test.com',
        name: 'Пользователь (Mock)',
        role: 'USER',
      } satisfies User);

    this.currentUser = user;
    return of(this.buildAuthResponse(user)).pipe(delay(180));
  }

  getEvents(search = ''): Observable<EventItem[]> {
    const query = search.trim().toLowerCase();
    const data = !query
      ? this.events
      : this.events.filter(
          (event) =>
            event.title.toLowerCase().includes(query) ||
            event.category.toLowerCase().includes(query) ||
            event.venue.name.toLowerCase().includes(query),
        );

    return of(data.map((event) => ({ ...event }))).pipe(delay(0));
  }

  getEventById(id: number): Observable<EventItem> {
    const event = this.events.find((item) => item.id === id);
    if (!event) {
      return throwError(() => new Error('Event not found'));
    }

    return of({ ...event }).pipe(delay(0));
  }

  getSeats(eventId: number): Observable<Seat[]> {
    this.releaseExpiredLocks();
    this.simulateSeatActivity(eventId);
    
    if (!this.seatsByEvent[eventId]) {
      const event = this.events.find(e => e.id === eventId);
      this.seatsByEvent[eventId] = this.createSeatGrid(event?.basePrice ?? 800, eventId);
    }
    
    return of((this.seatsByEvent[eventId] ?? []).map((seat) => ({ ...seat }))).pipe(delay(0));
  }

  lockSeat(eventId: number, seatId: number): Observable<LockResponse> {
    if (!this.seatsByEvent[eventId]) {
      const event = this.events.find(e => e.id === eventId);
      this.seatsByEvent[eventId] = this.createSeatGrid(event?.basePrice ?? 800, eventId);
    }

    const seat = this.seatsByEvent[eventId]?.find((item) => item.seatId === seatId);
    if (!seat || seat.status !== 'AVAILABLE') {
      return throwError(() => new Error('Seat is not available'));
    }

    seat.status = 'LOCKED';
    this.lockIdCounter += 1;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes lock
    this.locks.push({ lockId: this.lockIdCounter, eventId, seatId, expiresAt });

    return of({ lockId: this.lockIdCounter, expiresAt }).pipe(delay(0));
  }

  confirmBooking(lockId: number, paymentMethod: string): Observable<string> {
    const lock = this.locks.find((item) => item.lockId === lockId);
    if (!lock) {
      return throwError(() => new Error('Lock not found'));
    }

    const event = this.events.find((item) => item.id === lock.eventId);
    const seat = this.seatsByEvent[lock.eventId]?.find((item) => item.seatId === lock.seatId);

    if (!event || !seat) {
      return throwError(() => new Error('Booking payload is invalid'));
    }

    seat.status = 'BOOKED';
    this.bookings.unshift({
      ticketId: lock.lockId,
      eventTitle: event.title,
      seatLabel: seat.seatLabel,
      status: 'BOOKED',
      price: seat.price,
      bookedAt: new Date().toISOString(),
      eventStartTime: event.startTime,
    });
    this.locks = this.locks.filter((item) => item.lockId !== lockId);

    return of('Booking confirmed').pipe(delay(180));
  }

  cancelBooking(lockId: number): Observable<void> {
    const lock = this.locks.find((item) => item.lockId === lockId);
    if (lock) {
      const seat = this.seatsByEvent[lock.eventId]?.find((item) => item.seatId === lock.seatId);
      if (seat?.status === 'LOCKED') {
        seat.status = 'AVAILABLE';
      }
    }

    this.locks = this.locks.filter((item) => item.lockId !== lockId);
    return of(void 0).pipe(delay(0));
  }

  getCurrentUser(): Observable<User> {
    const user =
      this.currentUser ??
      ({
        id: 1,
        email: 'user@test.com',
        name: 'Пользователь (Mock)',
        role: 'USER',
      } satisfies User);

    return of(user).pipe(delay(0));
  }

  getUserBookings(): Observable<Booking[]> {
    return of(this.bookings.map((booking) => ({ ...booking }))).pipe(delay(0));
  }

  getVenues(): Observable<Venue[]> {
    return of(this.venues.map(v => ({ ...v }))).pipe(delay(0));
  }

  createEvent(payload: {
    title: string;
    description: string;
    venueId: number;
    startTime: string;
    basePrice: number;
    imageUrl?: string;
    ageRestriction?: string;
    category?: string;
  }): Observable<EventItem> {
    const venue = this.venues.find(v => v.id === payload.venueId);

    if (!venue) {
      return throwError(() => new Error('Venue not found'));
    }

    const id = Date.now();

    const newEvent: EventItem = {
      id,
      title: payload.title,
      description: payload.description,
      venue: {
        id: venue.id,
        name: venue.name,
        address: 'Адрес площадки Mock'
      },
      imageUrl: payload.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
      category: payload.category || 'Новое событие',
      ageRestriction: payload.ageRestriction || '12+',
      startTime: payload.startTime,
      basePrice: payload.basePrice
    };

    this.events.unshift(newEvent);
    this.seatsByEvent[id] = this.createSeatGrid(newEvent.basePrice, id);

    return of({ ...newEvent }).pipe(delay(0));
  }

  updateEvent(
    id: number,
    patch: Partial<EventItem> & { startTime?: string; basePrice?: number }
  ): Observable<EventItem> {
    const index = this.events.findIndex(e => e.id === id);

    if (index === -1) {
      return throwError(() => new Error('Event not found'));
    }

    const existing = this.events[index];

    const updated: EventItem = {
      ...existing,
      title: patch.title ?? existing.title,
      description: patch.description ?? existing.description,
      imageUrl: patch.imageUrl ?? existing.imageUrl,
      category: patch.category ?? existing.category,
      ageRestriction: patch.ageRestriction ?? existing.ageRestriction,
      startTime: patch.startTime ?? existing.startTime,
      basePrice: patch.basePrice ?? existing.basePrice,
    };

    this.events[index] = updated;

    // Re-generate seats if base price changes
    if (patch.basePrice !== undefined && patch.basePrice !== existing.basePrice) {
      this.seatsByEvent[id] = this.createSeatGrid(patch.basePrice, id);
    }

    return of({ ...this.events[index] }).pipe(delay(0));
  }

  deleteEvent(id: number): Observable<void> {
    this.events = this.events.filter(e => e.id !== id);
    delete this.seatsByEvent[id];
    return of(void 0).pipe(delay(0));
  }

  private buildAuthResponse(user: User): AuthResponse {
    return {
      token: `mock-jwt-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      user,
    };
  }

  private buildSeatsByEvent(): Record<number, Seat[]> {
    const result: Record<number, Seat[]> = {};
    for (const event of this.events) {
      result[event.id] = this.createSeatGrid(event.basePrice, event.id);
    }
    return result;
  }

  private createSeatGrid(basePrice: number, seed: number): Seat[] {
    const seats: Seat[] = [];
    let seatId = 1;
    const rowLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'И', 'К'];

    for (let row = 1; row <= 4; row += 1) {
      const letter = rowLetters[row - 1] || String(row);
      for (let column = 1; column <= 7; column += 1) {
        const marker = (seed + row * 11 + column * 7) % 13;
        const status = marker === 1 ? 'BOOKED' : marker === 4 ? 'LOCKED' : 'AVAILABLE';
        seats.push({
          seatId,
          seatLabel: `Ряд ${letter} место ${column}`,
          rowLabel: letter,
          seatNumber: column,
          status,
          price: basePrice,
        });
        seatId += 1;
      }
    }

    return seats;
  }

  private createVenueTemplate(): VenueSeatTemplate[] {
    const seats: VenueSeatTemplate[] = [];
    let id = 1;

    for (let row = 1; row <= 4; row += 1) {
      for (let column = 1; column <= 7; column += 1) {
        seats.push({
          id,
          row,
          column,
          label: `${row}-${column}`,
          disabled: column === 1 || (row === 1 && column > 4),
        });
        id += 1;
      }
    }

    return seats;
  }

  private releaseExpiredLocks(): void {
    const now = Date.now();
    const expired = this.locks.filter((lock) => new Date(lock.expiresAt).getTime() <= now);

    for (const lock of expired) {
      const seat = this.seatsByEvent[lock.eventId]?.find((item) => item.seatId === lock.seatId);
      if (seat?.status === 'LOCKED') {
        seat.status = 'AVAILABLE';
      }
    }

    this.locks = this.locks.filter((lock) => new Date(lock.expiresAt).getTime() > now);
  }

  private simulateSeatActivity(eventId: number): void {
    const seats = this.seatsByEvent[eventId];
    if (!seats?.length) {
      return;
    }

    const cursor = Math.floor(Date.now() / 3000) % seats.length;
    const seat = seats[cursor];
    const hasActiveLock = this.locks.some((lock) => lock.eventId === eventId && lock.seatId === seat.seatId);

    if (!hasActiveLock && seat.status === 'AVAILABLE' && cursor % 8 === 0) {
      seat.status = 'LOCKED';
    } else if (!hasActiveLock && seat.status === 'LOCKED' && cursor % 5 === 0) {
      seat.status = 'AVAILABLE';
    }
  }
}
