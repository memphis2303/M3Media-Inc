/* ===== STUDIO AVAILABILITY — edit this file to update the booking calendar =====
   Dates are written YYYY-MM-DD. Time slots must match the names in "slots" exactly.
   To mark time as taken, add a line to "booked", for example:
     "2026-12-05": { 1: ["1:00 PM","3:00 PM"], 2: "all" },
   (1 = Studio 1, 2 = Studio 2; "all" blocks the whole day for that studio.)
   To close both studios on a date, add it to "closed". */
window.STUDIO_CONFIG={
  studios:{1:"Studio 1: Victorian Bedroom",2:"Studio 2: Creative LED Set"},
  openDays:[1,2,3,4,5,6],            // 0=Sun, 1=Mon ... 6=Sat
  slots:["9:00 AM","11:00 AM","1:00 PM","3:00 PM","5:00 PM"], // each slot = 2 hours
  leadDays:2,                        // earliest bookable date = today + this many days
  monthsAhead:4,                     // how far ahead people can book
  closed:["2026-12-25","2026-12-26","2027-01-01"],
  booked:{}
};
