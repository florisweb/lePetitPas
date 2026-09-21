

export default class DatePlus extends Date {
    
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

