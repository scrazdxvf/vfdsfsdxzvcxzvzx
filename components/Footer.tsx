
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-lightCard dark:bg-darkCard text-center py-6 border-t border-lightBorder dark:border-darkBorder transition-colors duration-300">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        &copy; {new Date().getFullYear()} СКР БАРАХОЛКА. Все права защищены (на самом деле нет).
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
        Создано с <span role="img" aria-label="love">❤️</span> (и кодом) для демонстрационных целей.
      </p>
    </footer>
  );
};

export default Footer;
    