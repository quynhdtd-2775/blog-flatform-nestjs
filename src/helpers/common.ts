import { I18nContext } from 'nestjs-i18n';

export function i18n() {
  return (
    I18nContext.current() ?? {
      t: (key: string) => key,
    }
  );
}
