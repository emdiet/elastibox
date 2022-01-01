function fetchHTMLElement(element: HTMLElement | string): HTMLElement {
  if (typeof element === 'string') {
    const res = document.getElementById(element) as HTMLElement;
    if (!res) {
      throw new Error(`Element with id ${element} not found`);
    }
    return res;
  }
  return element;
}