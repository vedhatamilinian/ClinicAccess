import { Linking, Platform } from 'react-native';
import { isValidCoordinate } from './coordinates';

export function openDirections(options: {
  latitude?: number;
  longitude?: number;
  address: string;
  label?: string;
}) {
  const { latitude, longitude, address, label } = options;
  const name = encodeURIComponent(label ?? 'Clinic');
  let url: string;
  if (isValidCoordinate(latitude, longitude)) {
    if (Platform.OS === 'ios') {
      url = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${name}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }
  } else {
    const query = encodeURIComponent(address);
    if (Platform.OS === 'ios') {
      url = `http://maps.apple.com/?daddr=${query}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    }
  }
  return Linking.openURL(url);
}

export function openPhoneCall(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits) return Promise.resolve(false);
  return Linking.openURL(`tel:${digits}`);
}

export function openWebsite(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return Promise.resolve(false);
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return Linking.openURL(normalized);
}

export function clinicDirectionsTarget(clinic: {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}) {
  return {
    latitude: clinic.latitude,
    longitude: clinic.longitude,
    address: clinic.address,
    label: clinic.name,
  };
}
