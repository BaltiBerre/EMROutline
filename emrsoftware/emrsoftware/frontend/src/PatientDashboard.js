import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, FileText, User, AlertCircle } from 'lucide-react';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [personalInfo, setPersonalInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // We'll only fetch appointments and medical records for now
      // as they're already set up in your backend
      const [appointmentsResponse, recordsResponse] = await Promise.all([
        axios.get('/api/appointments', { headers }),
        axios.get('/api/medical-records', { headers })
      ]);

      setAppointments(appointmentsResponse.data || []);
      setMedicalRecords(recordsResponse.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">
          <AlertCircle className="h-6 w-6 mb-2 mx-auto" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Patient Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appointments Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Your Appointments</h2>
            </div>
            <div className="space-y-4">
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <div 
                    key={appointment.appointmentid} 
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {new Date(appointment.appointmentdate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.appointmenttime}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        appointment.status === 'Scheduled' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    {appointment.reasonforvisit && (
                      <p className="text-sm text-gray-600 mt-2">
                        Reason: {appointment.reasonforvisit}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No appointments scheduled
                </p>
              )}
            </div>
          </div>

          {/* Medical Records Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Recent Medical Records</h2>
            </div>
            <div className="space-y-4">
              {medicalRecords.length > 0 ? (
                medicalRecords.map((record) => (
                  <div 
                    key={record.recordid} 
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <p className="font-medium">
                      Visit Date: {new Date(record.visitdate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Treatment:</span> {record.treatment}
                    </p>
                    {record.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Notes:</span> {record.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No medical records found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;