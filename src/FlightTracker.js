import React, { useEffect, useState } from "react";
import axios from "axios";
import './FlightTracker.css';

const FlightTracker = () => {
  const [flightSummary, setFlightSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Crear array de horas del día
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const nextHour = (i + 1) % 24;
    return `${hour.toString().padStart(2, '0')}:00 a ${nextHour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://api.aviationstack.com/v1/flights', {
          params: {
            access_key: 'e028199dd421eed16a9b729c5cf5d08a',
            limit: 100,
            arr_iata: 'MAD'
          }
        });

        // Inicializar el resumen de vuelos
        const summary = {};
        timeSlots.forEach(timeSlot => {
          summary[timeSlot] = {
            T1: 0,
            T2: 0,
            T4: 0 // T4 y T4S juntos
          };
        });

        // Procesar los vuelos
        response.data.data.forEach(flight => {
          if (flight.arrival?.scheduled) {
            const hour = new Date(flight.arrival.scheduled).getHours();
            const timeSlot = `${hour.toString().padStart(2, '0')}:00 a ${((hour + 1) % 24).toString().padStart(2, '0')}:00`;
            
            const terminal = flight.arrival?.terminal;
            if (terminal) {
              if (terminal === '1') summary[timeSlot].T1++;
              else if (terminal === '2') summary[timeSlot].T2++;
              else if (terminal === '4' || terminal === '4S') summary[timeSlot].T4++;
            }
          }
        });

        setFlightSummary(summary);
      } catch (err) {
        setError('Error al cargar los vuelos');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, []);

  if (loading) return <div className="loading">Cargando resumen de vuelos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="flight-tracker">
      <h1>Resumen de Llegadas por Terminal - Aeropuerto de Madrid (MAD)</h1>
      <table className="flight-table">
        <thead>
          <tr>
            <th>Horario</th>
            <th>T1</th>
            <th>T2</th>
            <th>T4/T4S</th>
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((timeSlot) => (
            <tr key={timeSlot}>
              <td>{timeSlot}</td>
              <td>{flightSummary[timeSlot]?.T1 || 0}</td>
              <td>{flightSummary[timeSlot]?.T2 || 0}</td>
              <td>{flightSummary[timeSlot]?.T4 || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FlightTracker;
