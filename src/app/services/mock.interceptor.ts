import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { MockApiService } from './mock-api.service';
import { of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  const useMocks = (environment as any).useMocks;
  if (!useMocks) {
    return next(req);
  }

  const mockApi = inject(MockApiService);
  const url = req.url;

  if (!url.includes('/api/')) {
    return next(req);
  }

  console.log(`[Mock Interceptor] Intercepted request: ${req.method} ${url}`, req.body);

  const jsonResponse = (data: any, status = 200) => {
    return of(new HttpResponse({ status, body: data })).pipe(delay(0));
  };

  const textResponse = (data: string, status = 200) => {
    return of(new HttpResponse({ status, body: data })).pipe(delay(0));
  };

  const errorResponse = (message: string, status = 400) => {
    return throwError(() => new HttpErrorResponse({
      status,
      statusText: 'Bad Request',
      error: { message }
    })).pipe(delay(0));
  };

  try {
    const body = req.body as any;

    // 1. Auth routes
    if (url.endsWith('/api/auth/login')) {
      const { email, password } = body || {};
      return mockApi.login({ email, password }).pipe(
        switchMap(data => jsonResponse(data))
      );
    }
    if (url.endsWith('/api/auth/register')) {
      const { email, password, name } = body || {};
      return mockApi.register({ email, password, name }).pipe(
        switchMap(data => jsonResponse(data))
      );
    }
    if (url.endsWith('/api/auth/refresh')) {
      return mockApi.refresh().pipe(
        switchMap(data => jsonResponse(data))
      );
    }

    // 2. User Profile routes
    if (url.endsWith('/api/users/me')) {
      return mockApi.getCurrentUser().pipe(
        switchMap(data => jsonResponse(data))
      );
    }
    if (url.endsWith('/api/users/me/bookings')) {
      return mockApi.getUserBookings().pipe(
        switchMap(data => jsonResponse(data))
      );
    }

    // 3. Booking routes
    if (url.endsWith('/api/bookings/lock')) {
      const { eventId, seatId } = body || {};
      return mockApi.lockSeat(eventId, seatId).pipe(
        switchMap(data => jsonResponse(data))
      );
    }
    const confirmMatch = url.match(/\/api\/bookings\/(\d+)\/confirm/);
    if (confirmMatch && req.method === 'POST') {
      const lockId = Number(confirmMatch[1]);
      return mockApi.confirmBooking(lockId, 'FREE').pipe(
        switchMap(data => textResponse(data))
      );
    }
    const cancelMatch = url.match(/\/api\/bookings\/(\d+)$/);
    if (cancelMatch && req.method === 'DELETE') {
      const lockId = Number(cancelMatch[1]);
      return mockApi.cancelBooking(lockId).pipe(
        switchMap(() => jsonResponse(null, 204))
      );
    }

    // 4. Venues route
    if (url.endsWith('/api/venues')) {
      return mockApi.getVenues().pipe(
        switchMap(data => jsonResponse(data))
      );
    }

    // 5. Admin event routes
    if (url.endsWith('/api/admin/events') && req.method === 'POST') {
      return mockApi.createEvent(body).pipe(
        switchMap(data => jsonResponse(data))
      );
    }
    const adminEventPutMatch = url.match(/\/api\/admin\/events\/(\d+)$/);
    if (adminEventPutMatch && req.method === 'PUT') {
      const id = Number(adminEventPutMatch[1]);
      return mockApi.updateEvent(id, body).pipe(
        switchMap(data => jsonResponse(data))
      );
    }
    const adminEventDeleteMatch = url.match(/\/api\/admin\/events\/(\d+)$/);
    if (adminEventDeleteMatch && req.method === 'DELETE') {
      const id = Number(adminEventDeleteMatch[1]);
      return mockApi.deleteEvent(id).pipe(
        switchMap(() => jsonResponse(null, 204))
      );
    }

    // 6. Event seats route: GET /api/events/:eventId/seats
    const seatsMatch = url.match(/\/api\/events\/(\d+)\/seats/);
    if (seatsMatch) {
      const eventId = Number(seatsMatch[1]);
      return mockApi.getSeats(eventId).pipe(
        switchMap(data => jsonResponse(data))
      );
    }

    // 7. General event details: GET /api/events/:id
    const eventMatch = url.match(/\/api\/events\/(\d+)$/);
    if (eventMatch && req.method === 'GET') {
      const id = Number(eventMatch[1]);
      return mockApi.getEventById(id).pipe(
        switchMap(data => jsonResponse(data))
      );
    }

    // 8. General events list: GET /api/events
    if (url.includes('/api/events') && req.method === 'GET') {
      let search = '';
      const qIdx = url.indexOf('?');
      if (qIdx !== -1) {
        const queryParams = new URLSearchParams(url.substring(qIdx));
        search = queryParams.get('search') || '';
      }
      
      return mockApi.getEvents(search).pipe(
        switchMap(events => {
          const responseBody = {
            content: events,
            totalElements: events.length,
            totalPages: 1,
            size: events.length,
            number: 0
          };
          return jsonResponse(responseBody);
        })
      );
    }

    return errorResponse(`Mock handler not implemented for ${req.method} ${url}`);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Mock Error', 500);
  }
};
