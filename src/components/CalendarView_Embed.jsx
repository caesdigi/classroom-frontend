import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import ReactModal from 'react-modal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-datepicker/dist/react-datepicker.css';
import './CalendarView.css';

const localizer = momentLocalizer(moment);

const CustomInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
  <input
    type="text"
    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
    onClick={onClick}
    value={value || ''}
    readOnly
    placeholder={placeholder}
    ref={ref}
  />
));

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '35%',
    minWidth: '400px',
    maxHeight: '60vh',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }
};

const CalendarView = () => {
  const inputRefs = useRef([]);
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    student_phone: '',
    uid: '',
    remarks: '',
    room_id: null,
    date: null,
    start_time: '',
    end_time: ''
  });
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredStartTimes, setFilteredStartTimes] = useState([]);
  const [endTimeOptions, setEndTimeOptions] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uidInput, setUidInput] = useState(['', '', '', '', '']);
  const [cancellationError, setCancellationError] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [rooms, setRooms] = useState([]);
  const [roomAvailability, setRoomAvailability] = useState([]);
  const [roomStyles, setRoomStyles] = useState({});
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Resets datepicker and time on room change
  const handleRoomChange = (roomId) => {
    setFormData(prev => ({
      ...prev,
      room_id: roomId,
      uid: '',
      date: null,
      start_time: '',
      end_time: ''
    }));
  };

  // Updated rooms fetch effect
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setRoomsLoading(true);
        const response = await axios.get(import.meta.env.VITE_API_URL + '/rooms');
        if (response.data && response.data.length > 0) {
          const roomsData = response.data;
          setRooms(roomsData);
          
          const styles = {};
          roomsData.forEach(room => {
            styles[room.id] = {
              background: room.color_background,
              border: `1px solid ${room.color_border}`,
              color: room.color_text
            };
          });
          setRoomStyles(styles);
          
          // Set default room after data loads
          setFormData(prev => ({ 
            ...prev, 
            room_id: roomsData[0].id,
            start_time: '09:30', // Add default start time
            end_time: '10:20'    // Add default end time
          }));
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        // Add error handling
        setError('Failed to load room data. Please refresh the page.');
      } finally {
        setRoomsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!formData.room_id) return;
      try {
        const response = await axios.get(import.meta.env.VITE_API_URL + '/availability', {
          params: { room_id: formData.room_id }
        });
        setRoomAvailability(response.data);
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    };
    fetchAvailability();
  }, [formData.room_id]);

  const navigate = useNavigate();

  const eventPropGetter = (event) => {
    const style = roomStyles[event.roomId] || {
      background: '#e3f2fd',
      border: '1px solid #90caf9',
      color: '#0d47a1'
    };
    
    return {
      style: {
        ...style,
        textDecoration: event.is_cancelled ? 'line-through' : 'none',
        opacity: event.is_cancelled ? 0.6 : 1,
        // Add striped background for non-cancellable events
        backgroundImage: !event.can_cancel && !event.is_cancelled 
        ? 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 6px)'
        : undefined
      }
    };
  };

  const filterDate = (date) => {
    const dateMoment = moment(date);
    const dateString = dateMoment.format('YYYY-MM-DD');
    
    if (dateMoment.isBefore(moment(), 'day')) return false;
  
    // Check blocked dates
    const isBlocked = roomAvailability.some(entry => {
      const entryMin = moment(entry.min_date);
      const entryMax = moment(entry.max_date);
      const blockedDates = entry.blocked_dates?.map(d => moment(d).format('YYYY-MM-DD')) || [];
      return dateMoment.isBetween(entryMin, entryMax, 'day', '[]') &&
        blockedDates.includes(dateString);
    });
    if (isBlocked) return false;
  
    // Check available time slots with cutoff
    return roomAvailability.some(entry => {
      if (!dateMoment.isBetween(moment(entry.min_date), moment(entry.max_date), 'day', '[]')) {
        return false;
      }
      
      if (!entry.allowed_days.includes(dateMoment.day())) return false;
  
      // Generate potential slots
      const start = moment(entry.time_range.start, 'HH:mm');
      const end = moment(entry.time_range.end, 'HH:mm');
      const interval = entry.session_interval;
  
      let current = start.clone();
      while (current.isSameOrBefore(end)) {
        const slotTime = dateMoment.clone()
          .set('hour', current.hour())
          .set('minute', current.minute());
        
        // Calculate cutoff time (slot time - cutoff hours)
        const cutoffTime = slotTime.clone().subtract(entry.cutoff_hours, 'hours');
        
        if (moment().isBefore(cutoffTime)) {
          return true; // Found at least one valid slot
        }
        current.add(interval, 'minutes');
      }
      return false;
    });
  };

  const dayClassName = (date) => {
    const dateMoment = moment(date);
    const dateString = dateMoment.format('YYYY-MM-DD');
    
    // Blocked dates
    const isBlocked = roomAvailability.some(entry => {
      const entryMin = moment(entry.min_date);
      const entryMax = moment(entry.max_date);
      const blockedDates = entry.blocked_dates?.map(d => moment(d).format('YYYY-MM-DD')) || [];
      return dateMoment.isBetween(entryMin, entryMax, 'day', '[]') &&
        blockedDates.includes(dateString);
    });
    if (isBlocked) return 'react-datepicker__day--blocked';
  
    // Past dates
    if (dateMoment.isBefore(moment(), 'day')) {
      return 'react-datepicker__day--disabled';
    }
  
    // Check available slots considering cutoff
    const hasAvailableSlots = roomAvailability.some(entry => {
      if (!dateMoment.isBetween(moment(entry.min_date), moment(entry.max_date), 'day', '[]')) {
        return false;
      }
  
      if (!entry.allowed_days.includes(dateMoment.day())) {
        return false;
      }
  
      const start = moment(entry.time_range.start, 'HH:mm');
      const end = moment(entry.time_range.end, 'HH:mm');
      const interval = entry.session_interval;
  
      let current = start.clone();
      while (current.isSameOrBefore(end)) {
        const slotTime = dateMoment.clone()
          .set('hour', current.hour())
          .set('minute', current.minute());
  
        const cutoffTime = slotTime.clone().subtract(entry.cutoff_hours, 'hours');
        
        if (moment().isBefore(cutoffTime)) {
          return true;
        }
        current.add(interval, 'minutes');
      }
      return false;
    });
  
    return hasAvailableSlots ? '' : 'react-datepicker__day--disabled';
  };

  const generateEndTimes = (startTime) => {
    if (!formData.date || !formData.room_id) return [];
    const slot = filteredStartTimes.find(s => s.time === startTime);
    if (!slot) return [];
    
    const entry = slot.entry;
    const base = moment(`${formData.date}T${startTime}`);
    return entry.allowed_durations
      .map(duration => base.clone().add(duration, 'minutes'))
      .filter(time => time.isSameOrBefore(moment(`${formData.date}T${entry.time_range.end}`)))
      .map(time => time.format('HH:mm'));
  };

  useEffect(() => {
    const updateTimes = () => {
      if (!formData.date || !formData.room_id) {
        setFilteredStartTimes([]);
        return;
      }
  
      const dateMoment = moment(formData.date);
      const slots = roomAvailability
        .filter(entry => 
          dateMoment.isBetween(moment(entry.min_date), moment(entry.max_date), 'day', '[]') &&
          !entry.blocked_dates?.includes(formData.date) &&
          entry.allowed_days.includes(dateMoment.day())
        )
        .flatMap(entry => {
          const start = moment(entry.time_range.start, 'HH:mm');
          const end = moment(entry.time_range.end, 'HH:mm');
          const interval = entry.session_interval;
  
          const times = [];
          let current = start.clone();
          
          while(current.isSameOrBefore(end)) {
            const slotTime = dateMoment.clone()
              .set('hour', current.hour())
              .set('minute', current.minute());
            
            // Calculate cutoff time for this specific slot
            const cutoffTime = slotTime.clone().subtract(entry.cutoff_hours, 'hours');
            
            // Only include if current time is before cutoff
            if (moment().isBefore(cutoffTime)) {
              times.push({ 
                time: current.format('HH:mm'), 
                entry,
                priority: entry.time_range.start // Prioritize earlier entries
              });
            }
            current.add(interval, 'minutes');
          }
          return times;
        })
        .sort((a, b) => moment(a.time, 'HH:mm') - moment(b.time, 'HH:mm') || 
                        a.priority.localeCompare(b.priority));
  
      setFilteredStartTimes(slots);
      
      // Auto-select first available time
      if (slots.length > 0) {
        const newStart = slots[0].time;
        const newEnd = generateEndTimes(newStart)[0] || '';
        setFormData(prev => ({
          ...prev,
          start_time: newStart,
          end_time: newEnd
        }));
      }
    };
  
    updateTimes();
  }, [formData.date, formData.room_id, roomAvailability]);

  useEffect(() => {
    const options = generateEndTimes(formData.start_time);
    setEndTimeOptions(options);
    
    if (!options.includes(formData.end_time)) {
      setFormData(prev => ({
        ...prev,
        end_time: options[0] || ''
      }));
    }
  }, [formData.start_time, formData.date, formData.room_id]);

  const fetchBookings = useCallback(async () => {
    if (rooms.length === 0) return; // Wait for rooms data
  
    try {
      let rangeStart, rangeEnd;
      
      switch(view) {
        case 'month':
          rangeStart = moment(currentDate).startOf('month').startOf('week');
          rangeEnd = moment(currentDate).endOf('month').endOf('week').add(1, 'day');
          break;
        case 'week':
          rangeStart = moment(currentDate).startOf('week');
          rangeEnd = moment(currentDate).endOf('week').add(1, 'day');
          break;
        case 'day':
          rangeStart = moment(currentDate);
          rangeEnd = moment(currentDate).add(1, 'day');
          break;
        default:
          rangeStart = moment().subtract(15, 'days');
          rangeEnd = moment().add(15, 'days');
      }

      const response = await axios.get(import.meta.env.VITE_API_URL + '/bookings', {
        params: { 
          start_date: rangeStart.format('YYYY-MM-DD'),
          end_date: rangeEnd.format('YYYY-MM-DD'),
          show_cancelled: true
        }
      });
      
      const formattedEvents = response.data.map(booking => ({
        title: `${booking.student_name} (${rooms.find(r => r.id === booking.room_id)?.name || 'Unknown Room'})`,
        start: new Date(booking.start_time),
        end: new Date(booking.end_time),
        allDay: false,
        roomId: booking.room_id,
        id: booking.id,
        is_cancelled: booking.is_cancelled,
        can_cancel: booking.can_cancel,
        remarks: booking.remarks
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, [view, currentDate, rooms]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const validateSubmission = () => {
    if (!formData.date) {
      setError('Please select a date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateSubmission()) return;
  
    try {
      setLoading(true);
      const startDateTime = moment(`${formData.date} ${formData.start_time}`);
      const endDateTime = moment(`${formData.date} ${formData.end_time}`);
  
      await axios.post(import.meta.env.VITE_API_URL + '/bookings', {
        ...formData,
        uid: formData.uid.slice(-5),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString()
      });
  
      const bookedDate = new Date(formData.date);
      setCurrentDate(bookedDate);
      setView('week');
  
      await fetchBookings();
      
      setFormData(prev => ({
        ...prev,
        uid: '',
        room_id: rooms[0]?.id || null,
        date: null,
        start_time: '',
        end_time: ''
      }));
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
      setLoading(false);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isCancelled) window.location.reload();
    setIsModalOpen(false);
    setSelectedEvent(null);
    setIsCancelled(false);
    setCountdown(10);
    setUidInput(['', '', '', '', '']);
  };

  const handleUidChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newUid = [...uidInput];
      newUid[index] = value;
      setUidInput(newUid);
      
      if (value && index < 4) {
        inputRefs.current[index + 1].focus();
      }
    }
  };
  
  const handleUidKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !uidInput[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  const handleCancelBooking = async () => {
    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + '/bookings/cancel',
        {
          booking_id: selectedEvent.id,
          uid_attempt: uidInput.join('')
        }
      );
  
      if (response.data.success) {
        setIsCancelled(true);
        setCancellationError('');
        await fetchBookings();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Cancellation failed. Please check the code.';
      setCancellationError(errorMessage);
      setUidInput(['', '', '', '', '']);
      inputRefs.current[0].focus();
    }
  };

  useEffect(() => {
    let interval;
    if (isCancelled) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            window.location.reload();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCancelled]);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 mb-8 px-1">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.student_name}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.student_email}
              onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.student_phone}
                onChange={(e) => {
                  if (/^[0-9()+\-\s]*$/.test(e.target.value)) {
                    setFormData({ ...formData, student_phone: e.target.value });
                  }
                }}
                pattern="[0-9()+\-\s]+"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">UID (10 digits)</label>
              <input
                type="text"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.uid}
                onChange={(e) => {
                  if (/^\d{0,10}$/.test(e.target.value)) {
                    setFormData({ ...formData, uid: e.target.value });
                  }
                }}
                maxLength={10}
                pattern="\d{10}"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Room</label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.room_id || ''}
              onChange={(e) => handleRoomChange(Number(e.target.value))}
              disabled={roomsLoading}
            >
              {roomsLoading ? (
                <option value="">Loading rooms...</option>
              ) : (
                [
                  <option key="placeholder" value="" disabled>
                    Please select a room
                  </option>,
                  ...rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))
                ]
              )}
            </select>
          </div>

          <div className="space-y-1 w-full">
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <div className="w-full [&>.react-datepicker-wrapper]:w-full">
            <DatePicker
              selected={formData.date ? new Date(formData.date) : null}
              onChange={(date) => {
                const newDate = date ? moment(date).format('YYYY-MM-DD') : null;
                setFormData(prev => ({
                  ...prev,
                  date: newDate,
                  start_time: '',
                  end_time: ''
                }));
              }}
              minDate={roomAvailability.length > 0 ? 
                moment.min(roomAvailability.map(a => moment(a.min_date))).toDate() : 
                null
              }
              maxDate={roomAvailability.length > 0 ? 
                moment.max(roomAvailability.map(a => moment(a.max_date))).toDate() : 
                null
              }
              filterDate={(date) => {
                const dateMoment = moment(date);
                const dateString = dateMoment.format('YYYY-MM-DD');
                
                if (dateMoment.isBefore(moment(), 'day')) return false;
              
                // Convert blocked dates to consistent format
                const isBlocked = roomAvailability.some(entry => {
                  const entryMin = moment(entry.min_date);
                  const entryMax = moment(entry.max_date);
                  const blockedDates = entry.blocked_dates?.map(d => moment(d).format('YYYY-MM-DD')) || [];
                  return dateMoment.isBetween(entryMin, entryMax, 'day', '[]') &&
                    blockedDates.includes(dateString);
                });
              
                if (isBlocked) return false;
              
                return roomAvailability.some(entry => {
                  const entryMin = moment(entry.min_date);
                  const entryMax = moment(entry.max_date);
                  return dateMoment.isBetween(entryMin, entryMax, 'day', '[]') &&
                    entry.allowed_days.includes(dateMoment.day());
                });
              }}
              placeholderText={formData.room_id ? "Select available date" : "Select a room first"}
              customInput={<CustomInput />}
              dateFormat="yyyy-MM-dd"
              dayClassName={dayClassName}
              required
            />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                disabled={!formData.date || filteredStartTimes.length === 0}
              >
                {filteredStartTimes.length === 0 ? (
                  <option value="" disabled>
                    {formData.date ? 'No available slots' : 'Please select date'}
                  </option>
                ) : (
                  filteredStartTimes.map(slot => (
                    <option key={slot.time} value={slot.time}>{slot.time}</option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                disabled={endTimeOptions.length === 0}
              >
                {endTimeOptions.length === 0 ? (
                  <option value="" disabled>
                    {formData.start_time ? 'No available durations' : 'Please select start time'}
                  </option>
                ) : (
                  endTimeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
        
        <div className="col-span-2 space-y-1">
          <label className="block text-sm font-medium text-gray-700">Remarks (optional)</label>
          <textarea
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[2.5rem]"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            rows={1}
            placeholder="Special requests or notes"
          />
        </div>

        <button
          type="submit"
          className="col-span-2 mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Reserve'}
        </button>
      </form>

      {error && (
        <div className="mb-4 px-4">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-1">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 400 }}
          eventPropGetter={eventPropGetter}
          date={currentDate}
          view={view}
          onNavigate={setCurrentDate}
          onView={setView}
          onSelectEvent={handleEventClick}
          min={moment().set({ hour: 13, minute: 30 }).toDate()}
          max={moment().set({ hour: 16, minute: 50 }).toDate()}
          step={50}
          timeslots={1}
          formats={{
            timeGutterFormat: 'H:mm',
            eventTimeRangeFormat: ({ start, end }) => 
              `${moment(start).format('H:mm')} - ${moment(end).format('H:mm')}`,
            monthHeaderFormat: 'MMMM YYYY',
            dayHeaderFormat: 'dddd, MMM D',
            agendaHeaderFormat: ({ start, end }) =>
              `${moment(start).format('MMM D')} - ${moment(end).format('MMM D')}`
          }}
          views={['month', 'week', 'day', 'agenda']}
        />
      </div>
      <ReactModal
        isOpen={isModalOpen}
        onRequestClose={() => {
          if (isCancelled) window.location.reload();
          handleCloseModal();
        }}
        style={customStyles}
        contentLabel="Booking Details"
        ariaHideApp={false}
      >
        <div className="relative">
          <button
            onClick={() => {
              handleCloseModal();
              if (isCancelled) window.location.reload();
            }}
            className="absolute -right-2 -top-2 p-2 hover:text-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {selectedEvent && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-3">
                {isCancelled ? 'Reservation Cancelled' : 'Reservation Details'}
              </h2>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  ['Name:', selectedEvent.title.split(' (')[0]],
                  ['Room:', rooms.find(r => r.id === selectedEvent.roomId)?.name || 'N/A'],
                  ['Date:', moment(selectedEvent.start).format('DD MMMM YYYY (dddd)')],
                  ['Time:', `${moment(selectedEvent.start).format('HH:mm')} - ${moment(selectedEvent.end).format('HH:mm')}`],
                  ['Remarks:', selectedEvent.remarks || '(N/A)']
                ].map(([label, value], index) => (
                  <React.Fragment key={label}>
                    <div className={`col-span-1 font-semibold`}>
                      {label}
                    </div>
                    <div className={`col-span-2 ${isCancelled ? 'text-red-600 line-through' : ''}`}>
                      {value}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {!selectedEvent.is_cancelled ? (
                <div className="pt-4">
                  {selectedEvent.can_cancel ? (
                    <>
                      {!isCancelled && (
                        <>
                          <label className="block font-semibold mb-3">
                            To cancel, input the last 5 digits of your UID:
                          </label>
                          <div className="flex gap-6 justify-center">
                            {[0, 1, 2, 3, 4].map((index) => (
                              <input
                                key={index}
                                type="text"
                                maxLength="1"
                                className={`w-12 h-12 text-center border-2 rounded-lg text-xl
                                  ${document.activeElement === inputRefs.current[index]
                                    ? 'border-red-500'
                                    : 'border-gray-300'} 
                                  focus:border-red-500 focus:outline-none`}
                                value={uidInput[index]}
                                onChange={(e) => handleUidChange(index, e.target.value)}
                                onKeyDown={(e) => handleUidKeyDown(index, e)}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => {
                          if (isCancelled) window.location.reload();
                          else handleCancelBooking();
                        }}
                        className={`w-full py-2.5 rounded-md
                          ${
                            isCancelled
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : uidInput.join('').length === 5 
                                ? 'bg-red-600 hover:bg-red-700 font-medium text-white'
                                : 'bg-gray-300 text-gray-500 font-medium cursor-not-allowed'
                          }`}
                        disabled={!isCancelled && uidInput.join('').length < 5}
                      >
                        {isCancelled 
                          ? `Click to refresh (auto-refresh in ${countdown}s)`
                          : 'Cancel this reservation'}
                      </button>

                      {cancellationError && !isCancelled && (
                        <div className="text-center text-red-600 text-sm mt-3">
                          {cancellationError}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-600">
                      This reservation cannot be cancelled.
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-4">
                  <div className="text-center text-gray-600">
                    This reservation has been cancelled.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ReactModal>
    </div>
  );
};

export default CalendarView;