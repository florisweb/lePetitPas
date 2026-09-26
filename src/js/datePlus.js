

export default class DatePlus extends Date {
    get isLeapYear() {
        let year = this.getFullYear();
        return (year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0);
    }

    get daysInMonth() {
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        let curMonth = this.getMonth();
        if (curMonth === 1) return daysInMonth[curMonth] + (this.isLeapYear ? 1 : 0);
        return daysInMonth[curMonth];
    }
    
    getMonthName(_short = false) {
        const monthNames = ["January", "February", "March", "April", "June", "July", "August", "September", "October", "November", "December"];
        let name = monthNames[this.getMonth()];
        return _short ? name.substr(0, 3) : name;
    }

    getDayName(_short = false) {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let name = dayNames[this.getDay()];
        return _short ? name.substr(0, 3) : name;
    }
}
window.DatePlus = DatePlus;

