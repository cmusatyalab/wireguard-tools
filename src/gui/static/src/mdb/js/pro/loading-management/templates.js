/* eslint-disable import/prefer-default-export */
import Manipulator from '../../mdb/dom/manipulator';
import { element } from '../../mdb/util/index';

export function getBackdropTemplate({ backdropID, backdropOpacity, backdropColor }) {
  const backdrop = element('div');

  Manipulator.addClass(backdrop, 'loading-backdrop');
  backdrop.id = backdropID;
  Manipulator.addStyle(backdrop, { opacity: backdropOpacity, backgroundColor: backdropColor });

  return backdrop;
}
