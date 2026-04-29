/**
 * Component Loader - Dynamically load HTML components
 * Usage: loadComponent('header', '#target-selector')
 */

const COMPONENTS_PATH = 'components/';

/**
 * Load a single component
 * @param {string} componentName - Name of component file (without .html)
 * @param {string} targetSelector - CSS selector for target element
 * @param {object} vars - Variables to replace in component (e.g., {ID: 'center'})
 */
async function loadComponent(componentName, targetSelector, vars = {}) {
  try {
    const response = await fetch(`${COMPONENTS_PATH}${componentName}.html`);
    if (!response.ok) throw new Error(`Failed to load ${componentName}`);
    
    let html = await response.text();
    
    // Replace template variables
    Object.keys(vars).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, vars[key]);
    });
    
    const target = document.querySelector(targetSelector);
    if (target) {
      target.innerHTML += html;
    }
  } catch (error) {
    console.error(`Error loading component ${componentName}:`, error);
  }
}

/**
 * Load multiple components in sequence
 * @param {array} components - Array of {name, target, vars?}
 */
async function loadComponents(components) {
  for (const comp of components) {
    await loadComponent(comp.name, comp.target, comp.vars || {});
  }
}


/**
 * Load panel-specific components
 */
function loadPanelComponents(panelType = 'center') {
  const config = {
    center: [
      { name: 'patient-form', target: '#tab-patient', vars: { ID: 'center' } },
      { name: 'hospital-list', target: '#tab-hospitals', vars: { ID: 'center' } },
      { name: 'algo-info', target: '#tab-algo', vars: { ID: 'center' } },
      { name: 'map-panel', target: '#mainWrapper', vars: {} },
      { name: 'result-screen', target: 'body', vars: {} },
    ],
  };
  
  if (config[panelType]) {
    loadComponents(config[panelType]);
  }
}