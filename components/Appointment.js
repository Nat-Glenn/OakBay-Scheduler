"use client";

export default function Appointment({ appointment, active, setActive }) {
  const manageActive = (appointment) => {
    if (active?.id === appointment.id) {
      setActive(null);
    } else {
      setActive(appointment);
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "checked-in":
        return "bg-[#A0CE66]";
      case "checked-out":
        return "bg-[#002D58]";
      default:
        return "bg-[#00D0FF]";
    }
  };
  return (
    <div
      onClick={() => {
        if (appointment == active) {
          return;
        }
        manageActive(appointment);
      }}
      className={`${getStatusColor(
        appointment.status,
      )} hover:opacity-80 cursor-pointer flex flex-col`}
    >
      <p className="font-extrabold text-white">{appointment.name}</p>
      <p className="font-extralight text-sm text-white/80">
        {appointment.type}
      </p>
    </div>
  );
}
