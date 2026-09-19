from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5173'
SHOTS = '/tmp/agent-browser'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1070, 'height': 800})

    # Login con 2FA mock
    page.goto(BASE + '/')
    page.wait_for_load_state('networkidle')
    page.getByLabel('Email').fill('admin@example.test')
    page.getByLabel('Contraseña').fill('contraseña temporal')
    page.getByRole('button', name='Continuar con código').click()
    page.getByLabel('Código de verificación').fill('123456')
    page.getByRole('button', name='Ingresar a administración').click()
    page.wait_for_load_state('networkidle')

    # Dashboard con métricas
    page.wait_for_selector('text=Tareas pendientes')
    cards = page.locator('section[aria-labelledby="metricas-title"] a')
    print('dashboard cards:', cards.count())
    for i in range(cards.count()):
        print(' card:', cards.nth(i).locator('h3').inner_text(), '=', cards.nth(i).locator('p span').first.inner_text())
    page.screenshot(path=f'{SHOTS}/dashboard.png')

    # Navegación desde métrica a planillas filtradas
    cards.first.click()
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('h1:text("Planillas")')
    print('planillas url:', page.url)
    rows = page.locator('tbody tr')
    print('planillas rows (PENDING):', rows.count())
    badges = page.locator('tbody tr td:nth-child(5) span')
    for i in range(badges.count()):
        assert 'Pendiente' in badges.nth(i).inner_text(), 'badge no pendiente: ' + badges.nth(i).inner_text()
    page.screenshot(path=f'{SHOTS}/planillas-pendientes.png')

    # Diálogo de carga
    page.getByRole('button', name='Cargar planilla').click()
    page.wait_for_selector('text=Confirmar carga')
    print('upload dialog ok:', page.locator('dialog[open] h2').inner_text())
    page.getByRole('button', name='Cerrar carga de planilla').click()

    # Detalle de planilla
    page.locator('tbody tr').first.getByRole('button', name='Gestionar').click()
    page.wait_for_selector('text=Estado de procesamiento')
    print('detail dialog ok:', page.locator('dialog[open] h2').inner_text())
    print('detail sections:', page.locator('dialog[open] h3').all_inner_texts())
    page.screenshot(path=f'{SHOTS}/planilla-detalle.png')
    page.getByRole('button', name='Cerrar detalle de planilla').click()

    # Legajos
    page.goto(BASE + '/legajos')
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('h1:text("Legajos")')
    doc_rows = page.locator('tbody tr')
    print('legajos rows:', doc_rows.count())
    page.screenshot(path=f'{SHOTS}/legajos.png')

    # Detalle de documento con eliminación
    page.locator('tbody tr').first.getByRole('button', name='Gestionar').click()
    page.wait_for_selector('text=Eliminar documento')
    print('document dialog ok:', page.locator('dialog[open] h2').inner_text())
    print('document sections:', page.locator('dialog[open] h3').all_inner_texts())
    page.screenshot(path=f'{SHOTS}/documento-detalle.png')

    browser.close()
    print('VERIFY OK')
