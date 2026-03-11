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
        return "bg-foreground";
      default:
        return "bg-[#002D58]";
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case "checked-in":
        return "text-foreground";
      case "checked-out":
        return "text-background";
      default:
        return "dark:text-foreground text-background";
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
      )} hover:opacity-80 cursor-pointer flex h-full w-full text-left text-ellipsis overflow-hidden p-1 gap-2 flex-col rounded-lg`}
    >
      <p
        className={`${getStatusText(
          appointment.status,
        )} font-extrabold text-sm`}
      >
        {appointment.name}
      </p>
      <p className={`${getStatusText(appointment.status)} font-medium text-xs`}>
        {`${appointment.time} AM`}
      </p>
      <p className={`${getStatusText(appointment.status)} font-medium text-xs`}>
        {appointment.type}
      </p>
    </div>
  );
}
