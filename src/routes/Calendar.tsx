import "../css/styles.css";
import { NavLink, useNavigate } from "react-router";
import { useState, useContext, useEffect, useRef } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore"
import { UserContext } from "../context/userContext.ts";
import EventCalendarCard from "../components/EventCalendarCard.tsx";
import type { Event } from "@models/eventType.ts";
import { toast } from "react-toastify";
import { render } from "@testing-library/react";

export function Calendar(){
    const navigate = useNavigate()
    const usertest = useContext(UserContext)
    const [minimizeState, setMinimize] = useState(false)
    const [eventsList, setEventsList] = useState<Event[]>([])
    const [prevMonthSnap, setPrevMonthSnap] = useState<React.JSX.Element | null>()
    const [nextMonthSnap, setNextMonthSnap] = useState<React.JSX.Element | null>()

    useEffect(() => {
    
        // If there is no user logged in, skip this page and redirect to login page.
        if (usertest === null) {
        navigate("/");
        }
    }, [usertest, navigate]);
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    useEffect(() =>{
        const fetchEvents = async () => {
            let flag = false
            const getQuery = collection(db,"events")
            const eventsSnap = await getDocs(getQuery)
            const events: Event[]= []
            eventsSnap.forEach((event) => {
                try{
                    events.push({ docID: event.id, ...(event.data() as Event)})
                } catch (e) {
                    flag = true
                    console.error("Error fetching beneficiary: " + event.id, e)
                    return
                }
                setEventsList(events)
            })

            if (flag) {
                toast.warn("One or more events failed to load.");
            }
        }
        fetchEvents();
    }, [])

    const handleMinimize = () => {
        setMinimize(!minimizeState)
    }

    const currentDate = new Date()

    const [selectedDate, setSelectedDate] = useState(currentDate)
    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
    const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())

    const HandlePrevMonth = () => {
        setMinimize(false)
        setCurrentMonth((currentMonth) => currentMonth === 0 ? 11 : currentMonth - 1)
        setCurrentYear((currentYear) => currentMonth === 0 ? currentYear - 1 : currentYear)
    }

    const HandleNextMonth = () => {
        setMinimize(false)
        setCurrentMonth((currentMonth) => currentMonth === 11 ? 0 : currentMonth + 1)
        setCurrentYear((currentYear) => currentMonth === 11 ? currentYear + 1 : currentYear)
    }

    const handleDayClick = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day)
        setSelectedDate(newDate)
    }

    const handlePrevMonthDayClick = (day: number) => {
        const newDate = new Date(currentYear, currentMonth - 1, day)
        setSelectedDate(newDate)
        HandlePrevMonth()

    }

    const handleNextMonthDayClick = (day: number) => {
        const newDate = new Date(currentYear, currentMonth + 1, day)
        setSelectedDate(newDate)
        HandleNextMonth()
    }

    const handleToday = () => {
        setCurrentMonth(currentDate.getMonth())
        setCurrentYear(currentDate.getFullYear())
        setSelectedDate(currentDate)
    }

    const selectedEvents = eventsList.filter((event) => 
        event.start_date.toDate().getDate() === selectedDate.getDate() &&
        event.start_date.toDate().getMonth() === selectedDate.getMonth() &&
        event.start_date.toDate().getFullYear() === selectedDate.getFullYear()
    );

    const renderMonth = (month: number, year: number, selectedDate: Date) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDayOfMonth = new Date(year, month, 1).getDay()
        const daysInPrevMonth = new Date(year, month, 0).getDate()

        const daysPerMonth = [
            ...Array(firstDayOfMonth).fill(0),
            ... [...Array(daysInMonth).keys()].map((index) => index+1)
        ]

        const lastDaysOfPrevMonth = [...Array(daysInPrevMonth - (daysInPrevMonth - firstDayOfMonth)).keys()].map(
                                    (_,index) => 
                                        (daysInPrevMonth - firstDayOfMonth) + index + 1
                                    )
        const firstDaysOfNextMonth:number[] = []

        const weekNumbers: (number)[][] = []
        for (let i = 0; i < daysPerMonth.length; i+=7){
            let week = daysPerMonth.slice(i, i+7)
            if (week.length < 7){
                const extraDays = []
                for (let i = 1; i <= 7 - week.length; i++) {
                    extraDays.push(0);
                    firstDaysOfNextMonth.push(i)
                }
                weekNumbers.push([...week, ...extraDays])
            } 
            else {
                weekNumbers.push(week)
            }
        }
        
        const visibleWeeks: (number)[][] = minimizeState ? weekNumbers.filter((week) => week.includes(selectedDate.getDate())) : weekNumbers

        return (
            <div className={`grid grid-cols-7 gap-2`}> 
                {!minimizeState || (minimizeState && visibleWeeks[0][0] === 0) ? (
                    lastDaysOfPrevMonth.map((day,dayIndex) => 
                        <button 
                            type="button" 
                            className="grid h-10 py-2 text-center border rounded-full transition-all duration-200 text-gray-400"  
                            key={`day-${dayIndex}`}
                            onClick={() => handlePrevMonthDayClick(day)}
                        >
                            {day}
                        </button>
                    )) : (
                        null
                    )
                }
                {visibleWeeks.map((week, weekIndex) =>
                    (week.map((day,dayIndex) =>
                        <>
                            {day !== 0 ? (
                                <button 
                                    type="button"
                                    className={`grid h-10 py-2 text-center border rounded-full transition-all duration-200
                                                ${
                                                    day === selectedDate.getDate() &&
                                                    currentMonth === selectedDate.getMonth() &&
                                                    currentYear === selectedDate.getFullYear() ?
                                                    "text-white bg-secondary" : ""
                                                }
                                                ${
                                                    day === currentDate.getDate() &&
                                                    currentMonth === currentDate.getMonth() &&
                                                    currentYear === currentDate.getFullYear() ?
                                                    "text-primary" : ""
                                                }`} 
                                    key={`${weekIndex}-${day}`}
                                    onClick={() => handleDayClick(day)}>
                                    {day}
                                    {eventsList.some(event =>
                                        event?.start_date.toDate().getDate() === day &&
                                        event?.start_date.toDate().getMonth() === currentMonth &&
                                        event?.start_date.toDate().getFullYear() === currentYear
                                        ) && (
                                        <span className="-translate-x-1.5 w-2 h-2 bg-primary rounded-full"></span>
                                    )}
                                </button>
                            ) : (
                                null
                            )}
                        </>
                    ))
                )}
                {!minimizeState || (minimizeState && visibleWeeks[0][visibleWeeks[0].length-1] === 0) ? (
                    firstDaysOfNextMonth.map((day,dayIndex) => 
                        <button 
                            type="button" 
                            className="grid h-10 py-2 text-center border rounded-full transition-all duration-200 text-gray-400"  
                            key={`${dayIndex}-${day}`}
                            onClick={() => handleNextMonthDayClick(day)}
                        >
                            {day}
                        </button>
                    )) : (
                        null
                    )
                }
            </div>
        )
    }

    return(
        <div className={`transition-all duration-300 animate-fade overflow-hidden`}>
            <div className="flex flex-col items-start justify-start min-h-screen w-full p-4 sm:p-6">
                <div className={`w-full transition-all duration-300 animate-fade overflow-hidden ${minimizeState ? "max-h-40" : "max-h-screen"}`}>
                    <div className="w-full flex justify-between">
                        <button className="" onClick={HandlePrevMonth}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-arrow-left-icon lucide-circle-arrow-left"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/></svg></button>
                        <div className="flex flex-row items-center gap-3">
                            <span className="">{monthsOfYear[currentMonth]} {currentYear}</span>
                            <button className="transition-colors duration-300 ease-out text-white px-4 py-2 rounded-sm w-24 h-10 bg-gradient-to-r from-emerald-300 to-green-500 active:from-green-400 active:to-emerald-400" onClick={handleToday}>today</button>
                        </div>
                        <button className="" onClick={() => HandleNextMonth()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-arrow-right-icon lucide-circle-arrow-right"><circle cx="12" cy="12" r="10"/><path d="m12 16 4-4-4-4"/><path d="M8 12h8"/></svg></button>
                    </div>
                    <div className="w-full">
                        <div className="grid grid-cols-7 gap-2 border-b mb-4">
                            {daysOfWeek.map((day) => (
                                <span className="py-2 text-center font-semibold text-sm" key={day}>{day}</span>
                            ))}
                        </div>
                        {renderMonth(currentMonth, currentYear, selectedDate)}
                    </div>
                </div>
                <button onClick={handleMinimize} className={`w-full text-2xl flex justify-center items-center transition-all duration-200 animate-fade ${minimizeState ? "rotate-180 " : "rotate-0"}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg></button>
                <button onClick={handleMinimize} className={`w-full border-b text-2xl transition-all duration-300 animate-fade`}></button>
                <div className={`w-full animate-fade mt-4`}
                    key={selectedDate.toISOString()} >
                    <div className="flex flex-col justify-center space-y-2">
                        {selectedEvents.map((event) => (
                            <EventCalendarCard 
                                key={event.docID} 
                                date={event.start_date.toDate().toDateString().slice(event.start_date.toDate().toDateString().indexOf(' ') + 1)} 
                                event={event.event_name} 
                                time={event.start_date.toDate().getHours().toString() + ':' + event.start_date.toDate().getMinutes().toString()}/>
                        ))}
                        {selectedEvents.length === 0 ? "No Events!" : ""}
                    </div>
                </div>
            </div>
        </div>
    )
}