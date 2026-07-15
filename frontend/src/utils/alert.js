import Swal from 'sweetalert2';

/**
 * Gets the custom styling variables based on current document theme.
 */
const getThemeColors = () => {
  const isDark = document.body.classList.contains('dark-theme');
  return {
    background: isDark ? '#1C1917' : '#FAF8F5',
    color: isDark ? '#FAF8F5' : '#1C1917',
    confirmButtonColor: isDark ? '#FAF8F5' : '#1C1917',
    confirmButtonTextColor: isDark ? '#1C1917' : '#FAF8F5',
    cancelButtonColor: isDark ? '#2E2A27' : '#EBE9E4',
    cancelButtonTextColor: isDark ? '#A8A29E' : '#44403C',
  };
};

/**
 * Displays a premium alert dialog.
 */
export const showAlert = (title, text, icon = 'info') => {
  const colors = getThemeColors();
  
  return Swal.fire({
    title,
    text,
    icon,
    background: colors.background,
    color: colors.color,
    confirmButtonText: 'OK',
    confirmButtonColor: colors.confirmButtonColor,
    customClass: {
      popup: 'premium-alert-popup',
      confirmButton: 'premium-alert-confirm',
    },
    didOpen: () => {
      const confirmBtn = Swal.getConfirmButton();
      if (confirmBtn) {
        confirmBtn.style.color = colors.confirmButtonTextColor;
        confirmBtn.style.fontFamily = "'Smooch Sans', sans-serif";
        confirmBtn.style.fontWeight = '700';
        confirmBtn.style.letterSpacing = '0.04em';
        confirmBtn.style.borderRadius = '8px';
      }
    }
  });
};

/**
 * Displays a premium confirmation/prompt dialog to enter text.
 */
export const showPrompt = async (title, placeholder) => {
  const colors = getThemeColors();

  const result = await Swal.fire({
    title,
    input: 'text',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    background: colors.background,
    color: colors.color,
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    confirmButtonColor: colors.confirmButtonColor,
    cancelButtonColor: colors.cancelButtonColor,
    customClass: {
      popup: 'premium-alert-popup',
      confirmButton: 'premium-alert-confirm',
      cancelButton: 'premium-alert-cancel',
      input: 'premium-alert-input',
    },
    didOpen: () => {
      const confirmBtn = Swal.getConfirmButton();
      if (confirmBtn) {
        confirmBtn.style.color = colors.confirmButtonTextColor;
        confirmBtn.style.fontFamily = "'Smooch Sans', sans-serif";
        confirmBtn.style.fontWeight = '700';
        confirmBtn.style.borderRadius = '8px';
      }
      const cancelBtn = Swal.getCancelButton();
      if (cancelBtn) {
        cancelBtn.style.color = colors.cancelButtonTextColor;
        cancelBtn.style.fontFamily = "'Smooch Sans', sans-serif";
        cancelBtn.style.fontWeight = '700';
        cancelBtn.style.borderRadius = '8px';
      }
      const inputEl = Swal.getInput();
      if (inputEl) {
        inputEl.style.fontFamily = "'Smooch Sans', sans-serif";
        inputEl.style.background = 'var(--bg-input)';
        inputEl.style.color = 'var(--text-primary)';
        inputEl.style.border = '1px solid var(--border-default)';
        inputEl.style.borderRadius = '8px';
      }
    }
  });

  return result.isConfirmed ? result.value : null;
};
