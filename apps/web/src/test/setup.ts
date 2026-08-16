import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Vitest não é Jest — o cleanup automático do Testing Library entre testes
// (desmontar o que foi renderizado) não acontece sozinho, precisa ser
// registrado explicitamente. Sem isso, renders de um teste vazam pro
// próximo (e queries como getByRole passam a achar elementos duplicados).
afterEach(() => {
  cleanup();
});
