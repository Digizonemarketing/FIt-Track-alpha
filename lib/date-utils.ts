export const dateUtils = {
  format: (date: Date, formatStr: string): string => {
    const d = new Date(date)

    if (formatStr === "yyyy-MM-dd") {
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${d.getFullYear()}-${month}-${day}`
    }
    if (formatStr === "MMMM d") {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]
      return `${months[d.getMonth()]} ${d.getDate()}`
    }
    if (formatStr === "MMMM d, yyyy") {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    }
    if (formatStr === "EEE") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      return days[d.getDay()]
    }
    if (formatStr === "d") {
      return String(d.getDate())
    }
    if (formatStr === "MMM d, yyyy") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    }
    if (formatStr === "PPP") {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    }
    if (formatStr === "EEEE, MMMM d, yyyy") {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    }
    return d.toDateString()
  },

  startOfWeek: (date: Date, options?: { weekStartsOn: number }): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (options?.weekStartsOn === 1 ? 1 : 0)
    return new Date(d.setDate(diff))
  },

  addDays: (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  },

  addWeeks: (date: Date, weeks: number): Date => {
    return dateUtils.addDays(date, weeks * 7)
  },

  subWeeks: (date: Date, weeks: number): Date => {
    return dateUtils.addDays(date, -weeks * 7)
  },

  isToday: (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  },

  isSameDay: (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  },
}
