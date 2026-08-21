"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export default function DashboardCalendar({ goals = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Calculate days in current month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDayNumber = today.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Collect deadline day numbers for current month
  const deadlineDays = new Set();
  goals.forEach((goal) => {
    if (goal.deadline) {
      const parsedDate = new Date(goal.deadline);
      if (!isNaN(parsedDate.getTime())) {
        if (parsedDate.getFullYear() === year && parsedDate.getMonth() === month) {
          deadlineDays.add(parsedDate.getDate());
        }
      }
    }
  });

  // Build grid calendar days
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      isToday: false,
      hasDeadline: false,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const isToday = isCurrentMonth && d === currentDayNumber;
    const hasDeadline = deadlineDays.has(d);
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      isToday,
      hasDeadline,
    });
  }

  // Next month leading days to complete the 7-column grid
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    calendarCells.push({
      day: n,
      isCurrentMonth: false,
      isToday: false,
      hasDeadline: false,
    });
  }

  return (
    <div className="dashboard-card dashboard-calendar-card">
      <div className="card-header-row">
        <div className="calendar-header-title">
          <CalendarIcon size={18} style={{ color: "var(--primary)" }} />
          <h3 className="calendar-month-text">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="calendar-controls">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="calendar-today-btn"
            onClick={handleToday}
            title="Jump to today"
          >
            Today
          </button>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="calendar-grid-container">
        <div className="calendar-weekdays-row">
          {daysOfWeek.map((dayName, idx) => (
            <span key={idx} className="calendar-weekday-cell">
              {dayName}
            </span>
          ))}
        </div>

        <div className="calendar-days-grid">
          {calendarCells.map((cell, idx) => (
            <div
              key={idx}
              className={`calendar-day-cell ${
                !cell.isCurrentMonth ? "other-month" : ""
              } ${cell.isToday ? "today" : ""} ${
                cell.hasDeadline ? "has-deadline" : ""
              }`}
            >
              <span className="calendar-day-number">{cell.day}</span>
              {cell.hasDeadline && <span className="calendar-deadline-dot" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
