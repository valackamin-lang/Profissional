/**
 * Helper functions to serialize Sequelize models for API responses
 * Converts DECIMAL fields (which come as strings) to numbers
 */

export const serializeEvent = (event: any) => {
  if (!event) return event;
  
  const serialized = event.toJSON ? event.toJSON() : event;
  
  // Convert DECIMAL price to number
  if (serialized.price !== undefined && serialized.price !== null) {
    serialized.price = typeof serialized.price === 'string' 
      ? parseFloat(serialized.price) 
      : Number(serialized.price);
  }
  
  return serialized;
};

export const serializeMentorship = (mentorship: any) => {
  if (!mentorship) return mentorship;
  
  const serialized = mentorship.toJSON ? mentorship.toJSON() : mentorship;
  
  // Convert DECIMAL price to number
  if (serialized.price !== undefined && serialized.price !== null) {
    serialized.price = typeof serialized.price === 'string' 
      ? parseFloat(serialized.price) 
      : Number(serialized.price);
  }
  
  return serialized;
};

export const serializeEvents = (events: any[]) => {
  return events.map(serializeEvent);
};

export const serializeMentorships = (mentorships: any[]) => {
  return mentorships.map(serializeMentorship);
};
