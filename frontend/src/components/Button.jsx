import Icon from './Icon';

export default function Button({ variant = 'primary', size = 'md', icon, iconRight, onClick, disabled, children, className = '', href, target }) {
  const cls = `pt-btn pt-btn-${size} pt-btn-${variant} ${className}`;
  const iconSize = size === 'sm' ? 16 : 18;
  const inner = (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </>
  );
  if (href) return <a className={cls} href={href} target={target} rel="noreferrer">{inner}</a>;
  return <button className={cls} onClick={onClick} disabled={disabled}>{inner}</button>;
}
