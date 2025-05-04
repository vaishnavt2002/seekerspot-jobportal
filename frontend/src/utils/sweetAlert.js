// src/utils/sweetAlert.js
import Swal from 'sweetalert2';

/**
 * Show a confirmation dialog for joining a community
 * @param {string} communityName - The name of the community
 * @returns {Promise} - Resolves with the result of the confirmation
 */
export const showJoinConfirmation = (communityName) => {
  return Swal.fire({
    title: 'Join Community',
    text: `Are you sure you want to join ${communityName}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, join!',
    cancelButtonText: 'Cancel'
  });
};

/**
 * Show a confirmation dialog for leaving a community
 * @param {string} communityName - The name of the community
 * @returns {Promise} - Resolves with the result of the confirmation
 */
export const showLeaveConfirmation = (communityName) => {
  return Swal.fire({
    title: 'Leave Community',
    text: `Are you sure you want to leave ${communityName}? You will no longer receive messages from this community.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, leave!',
    cancelButtonText: 'Cancel'
  });
};

/**
 * Show a success message
 * @param {string} title - The title of the message
 * @param {string} message - The message to display
 */
export const showSuccess = (title, message) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    timer: 2000,
    timerProgressBar: true
  });
};

/**
 * Show an error message
 * @param {string} title - The title of the message
 * @param {string} message - The message to display
 */
export const showError = (title, message) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'error'
  });
};

/**
 * Show a loading message
 * @param {string} message - The message to display while loading
 * @returns {Function} - Function to close the loading message
 */
export const showLoading = (message) => {
  Swal.fire({
    title: 'Loading',
    text: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  return () => Swal.close();
};