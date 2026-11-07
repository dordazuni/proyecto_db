#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de Documentos Oficiales (DOCX editable y PDF)
Manual de Creación, Configuración y Despliegue en VirtualBox - SIGH
Universidad El Bosque
"""

import sys
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from fpdf import FPDF

ROOT_DIR = Path(__file__).resolve().parent
DOCS_VM_DIR = ROOT_DIR / "docs" / "virtual-machine"

DOCX_PATH = DOCS_VM_DIR / "SIGH - Manual Despliegue VirtualBox.docx"
PDF_PATH = DOCS_VM_DIR / "SIGH - Manual Despliegue VirtualBox.pdf"


def set_cell_background(cell, hex_color: str):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tc_pr.append(shd)


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tc_mar.append(node)
    tc_pr.append(tc_mar)


def create_docx():
    print(f">>> Generando DOCX: {DOCX_PATH.name}...")
    doc = Document()

    # Configuración de márgenes (Estándar 2.5 cm)
    for section in doc.sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)

    PRIMARY = RGBColor(27, 54, 93)     # Azul Institucional (#1B365D)
    SECONDARY = RGBColor(0, 122, 135)  # Verde Azulado (#007A87)
    TEXT_DARK = RGBColor(33, 37, 41)   # Carbón texto (#212529)

    # TÍTULO PRINCIPAL
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_t = title_p.add_run("SIGH — Sistema Integrado de Gestión de Horarios")
    run_t.font.name = "Arial"
    run_t.font.size = Pt(22)
    run_t.font.bold = True
    run_t.font.color.rgb = PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(14)
    run_s = sub_p.add_run("Manual de Creación, Configuración y Despliegue en VirtualBox (Entorno Local)")
    run_s.font.name = "Arial"
    run_s.font.size = Pt(14)
    run_s.font.color.rgb = SECONDARY
    run_s.font.bold = True

    # TABLA DE METADATOS
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    meta_data = [
        ("Asignatura:", "Bases de Datos 1 — Universidad El Bosque"),
        ("Docente:", "Ing. Christian Felipe Duarte"),
        ("Responsable de Infraestructura:", "David Alejandro Ordaz Luque"),
        ("Componentes Desplegados:", "PostgreSQL 18 (BD) + Spring Boot 4 (API) + Angular 21 (Web)"),
        ("Entorno de Virtualización:", "Oracle VM VirtualBox (2 Máquinas Virtuales en Adaptador Puente)"),
    ]

    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        set_cell_background(c0, "F0F4F8")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)

        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(k)
        r0.font.name = "Arial"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = PRIMARY

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(v)
        r1.font.name = "Arial"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = TEXT_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = PRIMARY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = SECONDARY
        return p

    def add_body(text, bold_prefix=""):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Arial"
            rb.font.size = Pt(10)
            rb.font.bold = True
            rb.font.color.rgb = TEXT_DARK
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.color.rgb = TEXT_DARK
        return p

    def add_code(text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.7)
        set_cell_background(cell, "F5F7FA")
        set_cell_margins(cell, 80, 80, 120, 120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(text)
        r.font.name = "Consolas"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(40, 44, 52)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_alert(title, text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.7)
        set_cell_background(cell, "EBF5FB")
        set_cell_margins(cell, 100, 100, 140, 140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        rt = p.add_run(f"[{title}] ")
        rt.font.name = "Arial"
        rt.font.size = Pt(9.5)
        rt.font.bold = True
        rt.font.color.rgb = PRIMARY
        rc = p.add_run(text)
        rc.font.name = "Arial"
        rc.font.size = Pt(9.5)
        rc.font.color.rgb = TEXT_DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 1. ARQUITECTURA
    add_h1("1. Arquitectura de Despliegue Local")
    add_body(
        "Para simular fielmente el entorno que se desplegó en AWS EC2 pero dentro de la infraestructura local del estudiante, "
        "se crearon dos máquinas virtuales independientes sobre Oracle VM VirtualBox, enlazadas en la misma red local mediante "
        "un Adaptador Puente (Bridged Networking):"
    )

    t_arch = doc.add_table(rows=9, cols=3)
    t_arch.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Parámetro", "VM 1: Aplicación (Web + API)", "VM 2: Base de Datos (RDBMS)"]
    for j, h in enumerate(headers):
        cell = t_arch.cell(0, j)
        set_cell_background(cell, "1B365D")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.name = "Arial"
        r.font.size = Pt(9)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    arch_rows = [
        ("Nombre en VirtualBox", "SIGH-APP-SERVER", "SIGH-DB-SERVER"),
        ("Sistema Operativo", "Ubuntu Server 24.04 / 26.04 LTS (64-bit)", "Ubuntu Server 24.04 / 26.04 LTS (64-bit)"),
        ("Memoria RAM Asignada", "2048 MB (2 GB)", "1536 MB (1.5 GB)"),
        ("Procesadores (vCPU)", "2 Procesadores", "1 Procesador"),
        ("Disco Virtual (VDI)", "20 GB (Dinámicamente asignado)", "20 GB (Dinámicamente asignado)"),
        ("Tipo de Adaptador de Red", "Adaptador Puente (Bridged Adapter)", "Adaptador Puente (Bridged Adapter)"),
        ("IP Asignada en la Red", "192.168.78.120", "192.168.78.126"),
        ("Componentes en Ejecución", "Nginx (Puerto 80) + Spring Boot (8080)", "PostgreSQL 18 (Puerto 5432)"),
    ]

    for i, row_data in enumerate(arch_rows, start=1):
        bg = "F9FAFC" if i % 2 == 1 else "FFFFFF"
        for j, val in enumerate(row_data):
            cell = t_arch.cell(i, j)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.name = "Arial"
            r.font.size = Pt(8.5)
            if j == 0:
                r.font.bold = True
                r.font.color.rgb = PRIMARY
            else:
                r.font.color.rgb = TEXT_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 2. CREACIÓN EN VIRTUALBOX
    add_h1("2. Creación e Instalación de las Máquinas en VirtualBox")
    add_h2("2.1. Creación de cada Máquina Virtual")
    add_body("1. Abrir Oracle VM VirtualBox y hacer clic en 'Nueva'.")
    add_body("2. Asignar nombre (ej. SIGH-DB-SERVER o SIGH-APP-SERVER), tipo Linux, versión Ubuntu (64-bit) y cargar la ISO oficial.")
    add_body("3. Marcar la casilla 'Omitir instalación desatendida' (Skip Unattended Installation) para control manual.")
    add_body("4. Asignar recursos: 1.5 a 2 GB de RAM y 1 a 2 CPUs.")
    add_body("5. Crear disco virtual VDI dinámico de 20 GB.")

    add_h2("2.2. Configuración Esencial de Red (Adaptador Puente)")
    add_alert(
        "IMPORTANTE: CONFIGURACIÓN DE RED",
        "Por defecto VirtualBox configura la red en modo NAT, lo cual aísla la máquina virtual. "
        "Se debe cambiar obligatoriamente a 'Adaptador Puente' (Bridged Adapter) seleccionando la tarjeta Wi-Fi o Ethernet activa "
        "de tu computador. Esto permite que el anfitrión (Windows) y ambas máquinas virtuales compartan el mismo segmento de red."
    )

    add_h2("2.3. Instalación de Ubuntu Server")
    add_body("1. Iniciar la máquina virtual y seguir el asistente de instalación estándar.")
    add_body("2. Configuración de red: Dejar DHCP automático; la máquina tomará una IP asignada por tu router (ej. 192.168.78.X).")
    add_body("3. Usuario y contraseña: Se estipuló el usuario 'user' con contraseña '1234'.")
    add_body("4. En la pantalla de SSH, marcar obligatoriamente la casilla '[X] Install OpenSSH server'.")
    add_body("5. Finalizar la instalación y reiniciar.")

    # 3. PREPARACIÓN EN TERMINAL
    add_h1("3. Preparación Inicial de las Máquinas Virtuales")
    add_h2("3.1. En la VM de Base de Datos (192.168.78.126)")
    add_body("Ejecutar en la consola de la máquina para instalar PostgreSQL y habilitar SSH:")
    add_code(
        "sudo apt update && sudo apt install -y openssh-server postgresql postgresql-contrib\n"
        "sudo systemctl enable --now ssh\n"
        "sudo ufw allow 22/tcp && sudo ufw allow 5432/tcp\n"
        "hostname -I"
    )

    add_h2("3.2. En la VM de Aplicación (192.168.78.120)")
    add_body("Ejecutar en la consola de la máquina para instalar OpenJDK 17 y Nginx:")
    add_code(
        "sudo apt update && sudo apt install -y openssh-server openjdk-17-jdk nginx curl\n"
        "sudo systemctl enable --now ssh\n"
        "sudo ufw allow 22/tcp && sudo ufw allow 80/tcp\n"
        "hostname -I"
    )

    # 4. COMPILACIÓN
    add_h1("4. Compilación de los Proyectos en Windows (Host)")
    add_body("Antes de transferir los artefactos, se compilan en la máquina de desarrollo Windows:")
    add_h2("Compilación del Frontend (Angular 21):")
    add_code(
        "cd C:\\Users\\dorda\\IdeaProjects\\proyecto_db\\source\\front-end\\front-horarios\n"
        "npm install\n"
        "npm run build\n"
        "# Genera: dist/front-horarios/browser/"
    )
    add_h2("Compilación del Backend (Spring Boot):")
    add_code(
        "cd C:\\Users\\dorda\\IdeaProjects\\proyecto_db\\source\\back-end\\api_horarios\n"
        ".\\gradlew.bat bootJar --no-daemon\n"
        "# Genera: build/libs/apihorarios-0.0.1-SNAPSHOT.jar"
    )

    # 5. DESPLIEGUE
    add_h1("5. Despliegue y Puesta en Marcha")
    add_h2("Opción A: Despliegue Automatizado con deploy_vbox.ps1")
    add_body(
        "Se desarrolló un script de orquestación que compila, transfiere y aprovisiona ambas máquinas automáticamente sin intervención manual. "
        "Desde la raíz del proyecto en PowerShell se ejecuta:"
    )
    add_code("powershell -ExecutionPolicy Bypass -File .\\deploy_vbox.ps1 -SkipBuild")

    add_h2("Opción B: Despliegue Técnico Paso a Paso")
    add_body("1. Configuración de PostgreSQL en la VM BD:", "Paso 1: ")
    add_body(
        "En /etc/postgresql/18/main/postgresql.conf se establece 'listen_addresses = *'. "
        "En /etc/postgresql/18/main/pg_hba.conf se autoriza la red 'host all all 192.168.78.0/24 scram-sha-256'. "
        "Se reinicia con 'sudo systemctl restart postgresql'."
    )
    add_body("2. Ejecución ordenada de scripts de BD:", "Paso 2: ")
    add_body(
        "Se suben los scripts de source/db/ y se ejecutan en orden: 01_ddl.sql, 02_catalogos.sql, 03_funciones_triggers.sql, "
        "04_vistas.sql, 05_roles_permisos.sql (con app_password='1234'), 06_datos_prueba.sql y 07_pruebas_reglas.sql. "
        "El script 07 confirma que las 46 pruebas de reglas de negocio pasaron satisfactoriamente (46 | 46 | 0)."
    )
    add_body("3. Publicación del Frontend en Nginx:", "Paso 3: ")
    add_body(
        "Los archivos compilados de Angular se copian a /var/www/html con permisos para www-data. "
        "En /etc/nginx/sites-available/default se configura la directiva 'try_files $uri $uri/ /index.html;' para soportar rutas internas de Angular (SPA) "
        "y el bloque 'location /api/ { proxy_pass http://localhost:8080/api/; }' para actuar como proxy inverso hacia Spring Boot."
    )
    add_body("4. Configuración del Servicio Systemd para la API:", "Paso 4: ")
    add_body(
        "El archivo .jar se ubica en /home/user/app/api/ y se registra el servicio /etc/systemd/system/sigh-api.service "
        "inyectando las variables DB_HOST=192.168.78.126, DB_PORT=5432, DB_NAME=sigh y DB_PASSWORD=1234. "
        "Se inicia con 'sudo systemctl enable --now sigh-api'."
    )

    # 6. VERIFICACIÓN
    add_h1("6. Verificación y Pruebas del Sistema")
    add_body("Una vez finalizado el despliegue, se validan los siguientes puntos de acceso en el navegador de Windows:")

    t_eval = doc.add_table(rows=6, cols=3)
    t_eval.alignment = WD_TABLE_ALIGNMENT.CENTER
    for j, h in enumerate(["Componente", "URL de Prueba", "Resultado Esperado"]):
        cell = t_eval.cell(0, j)
        set_cell_background(cell, "1B365D")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.name = "Arial"
        r.font.size = Pt(9)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    tests = [
        ("Frontend Web (SPA)", "http://192.168.78.120/", "Carga completa del home de SIGH sin errores en consola."),
        ("Login Directo", "http://192.168.78.120/#/login", "Acceso interactivo con credenciales de prueba admin / 123456."),
        ("Estado de Conexión", "http://192.168.78.120/#/conexion", "Indicador verde confirmando conexión entre Angular y Spring Boot."),
        ("API Echo (Proxy Nginx)", "http://192.168.78.120/api/echo", "JSON con estado 'UP' y fecha del servidor."),
        ("Base de Datos (PostgreSQL)", "192.168.78.126:5432 (sigh)", "20 tablas y 7 vistas activas validadas con 46/46 reglas aprobadas."),
    ]

    for i, (c, u, res) in enumerate(tests, start=1):
        bg = "F9FAFC" if i % 2 == 1 else "FFFFFF"
        for j, val in enumerate([c, u, res]):
            cell = t_eval.cell(i, j)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.name = "Arial"
            r.font.size = Pt(8.5)
            if j == 0:
                r.font.bold = True
                r.font.color.rgb = PRIMARY
            else:
                r.font.color.rgb = TEXT_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 7. TROUBLESHOOTING
    add_h1("7. Lecciones Aprendidas y Solución de Problemas (Troubleshooting)")
    add_body("1. Error de ExecutionPolicy en PowerShell:", "Caso 1: ")
    add_body("Windows bloquea scripts .ps1 externos por seguridad. Se solventa invocando powershell con '-ExecutionPolicy Bypass'.")
    add_body("2. Error de Permisos en /etc/sudoers ('owned by uid..., should be 0'):", "Caso 2: ")
    add_body("Si sudo se bloquea por permisos en la VM, se reinicia en 'Recovery Mode' de GRUB, se monta en lectura/escritura (mount -o remount,rw /) y se restaura con 'chown root:root /etc/sudoers && chmod 440 /etc/sudoers'.")
    add_body("3. Socket UNIX de PostgreSQL Caído ('socket failed: No such file or directory'):", "Caso 3: ")
    add_body("En instalaciones limpias donde el cluster main no inicia, se soluciona recreándolo con 'sudo pg_dropcluster 18 main --stop' y 'sudo pg_createcluster -u postgres -g postgres -e UTF-8 18 main --start'.")
    add_body("4. Rutas Internas de Angular arrojando 404 en Nginx:", "Caso 4: ")
    add_body("Al ser una SPA, el servidor web no tiene archivos físicos por cada ruta de Angular. Se soluciona mediante 'try_files $uri $uri/ /index.html;' en la configuración de Nginx.")

    doc.save(DOCX_PATH)
    print(f"    [OK] Archivo DOCX guardado en: {DOCX_PATH}")


class PDFReport(FPDF):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Cargar fuentes TTF del sistema Windows para soporte UTF-8 completo
        font_dir = Path("C:/Windows/Fonts")
        if (font_dir / "arial.ttf").is_file():
            self.add_font("ArialUnicode", "", str(font_dir / "arial.ttf"))
            self.add_font("ArialUnicode", "B", str(font_dir / "arialbd.ttf"))
            self.add_font("ArialUnicode", "I", str(font_dir / "ariali.ttf"))
            self.default_font = "ArialUnicode"
        else:
            self.default_font = "Helvetica"

    def header(self):
        self.set_font(self.default_font, "B", 8)
        self.set_text_color(27, 54, 93)
        self.cell(0, 5, "SIGH - Universidad El Bosque | Bases de Datos 1", border=0, align="L")
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, "Manual de Despliegue en VirtualBox", border=0, align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_draw_color(200, 200, 200)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(2)
        self.set_font(self.default_font, "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, "David Alejandro Ordaz Luque - Infraestructura y Aplicación", border=0, align="L")
        self.cell(0, 8, f"Página {self.page_no()}/{{nb}}", border=0, align="R")


def create_pdf():
    print(f">>> Generando PDF: {PDF_PATH.name}...")
    pdf = PDFReport(orientation="P", unit="mm", format="A4")
    f_family = pdf.default_font
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    PRIMARY = (27, 54, 93)
    SECONDARY = (0, 122, 135)
    TEXT_COLOR = (40, 40, 40)

    # TÍTULO
    pdf.set_font(f_family, "B", 18)
    pdf.set_text_color(*PRIMARY)
    pdf.multi_cell(pdf.epw, 8, "SIGH - Sistema Integrado de Gestión de Horarios", align="L")
    pdf.set_font(f_family, "B", 12)
    pdf.set_text_color(*SECONDARY)
    pdf.multi_cell(pdf.epw, 6, "Manual de Creación, Configuración y Despliegue en VirtualBox (Entorno Local)", align="L")
    pdf.ln(3)

    # TABLA METADATOS
    pdf.set_fill_color(240, 244, 248)
    pdf.set_draw_color(210, 220, 230)

    meta = [
        ("Asignatura:", "Bases de Datos 1 - Universidad El Bosque"),
        ("Docente:", "Ing. Christian Felipe Duarte"),
        ("Responsable de Infraestructura:", "David Alejandro Ordaz Luque"),
        ("Componentes Desplegados:", "PostgreSQL 18 (BD) + Spring Boot 4 (API) + Angular 21 (Web)"),
        ("Entorno de Virtualización:", "Oracle VM VirtualBox (2 Máquinas Virtuales en Adaptador Puente)"),
    ]

    for k, v in meta:
        pdf.set_font(f_family, "B", 8.5)
        pdf.set_text_color(*PRIMARY)
        pdf.cell(50, 6, f" {k}", border=1, fill=True)
        pdf.set_font(f_family, "", 8.5)
        pdf.set_text_color(*TEXT_COLOR)
        pdf.cell(140, 6, f" {v}", border=1, fill=False, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(5)

    def p_h1(title):
        pdf.ln(2)
        pdf.set_font(f_family, "B", 13)
        pdf.set_text_color(*PRIMARY)
        pdf.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(*PRIMARY)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 60, pdf.get_y())
        pdf.ln(2)

    def p_h2(title):
        pdf.ln(1)
        pdf.set_font(f_family, "B", 10.5)
        pdf.set_text_color(*SECONDARY)
        pdf.cell(0, 6, title, new_x="LMARGIN", new_y="NEXT")

    def p_body(text, bold_prefix=""):
        pdf.set_font(f_family, "", 9)
        pdf.set_text_color(*TEXT_COLOR)
        if bold_prefix:
            pdf.set_font(f_family, "B", 9)
            pdf.write(5, bold_prefix)
            pdf.set_font(f_family, "", 9)
        pdf.write(5, text)
        pdf.ln(6)

    def p_code(code_text):
        pdf.set_fill_color(245, 247, 250)
        pdf.set_draw_color(220, 225, 230)
        pdf.set_font(f_family, "", 8)
        pdf.set_text_color(30, 30, 30)
        pdf.multi_cell(pdf.epw, 4.5, code_text, border=1, fill=True)
        pdf.ln(3)

    # 1. ARQUITECTURA
    p_h1("1. Arquitectura de Despliegue Local")
    p_body(
        "Se diseñó una arquitectura de dos niveles con máquinas virtuales independientes en VirtualBox, "
        "comunicadas en red local mediante Adaptador Puente (Bridged):"
    )

    pdf.set_fill_color(27, 54, 93)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(f_family, "B", 8)
    pdf.cell(48, 6, " Parámetro", border=1, fill=True)
    pdf.cell(71, 6, " VM 1: Aplicación (Web + API)", border=1, fill=True)
    pdf.cell(71, 6, " VM 2: Base de Datos (PostgreSQL)", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

    arch_data = [
        ("Nombre VM", "SIGH-APP-SERVER", "SIGH-DB-SERVER"),
        ("Sistema Operativo", "Ubuntu Server 24.04 / 26.04 LTS", "Ubuntu Server 24.04 / 26.04 LTS"),
        ("RAM / CPUs", "2048 MB (2 GB) / 2 CPUs", "1536 MB (1.5 GB) / 1 CPU"),
        ("Disco Virtual (VDI)", "20 GB (Dinámico)", "20 GB (Dinámico)"),
        ("Modo de Red", "Adaptador Puente (Bridged)", "Adaptador Puente (Bridged)"),
        ("Dirección IP", "192.168.78.120", "192.168.78.126"),
        ("Servicios Activos", "Nginx (80) + Spring Boot (8080)", "PostgreSQL 18 (5432)"),
    ]

    for i, (p, v1, v2) in enumerate(arch_data):
        fill = (i % 2 == 1)
        pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
        pdf.set_font(f_family, "B", 8)
        pdf.set_text_color(*PRIMARY)
        pdf.cell(48, 5.5, f" {p}", border=1, fill=True)
        pdf.set_font(f_family, "", 8)
        pdf.set_text_color(*TEXT_COLOR)
        pdf.cell(71, 5.5, f" {v1}", border=1, fill=True)
        pdf.cell(71, 5.5, f" {v2}", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(4)

    # 2. VIRTUALBOX
    p_h1("2. Creación e Instalación en VirtualBox")
    p_h2("2.1. Configuración de Hardware y Red")
    p_body("- Crear VM tipo Linux Ubuntu (64-bit) con 1.5 a 2 GB de RAM y 20 GB de disco.")
    p_body("- En Configuración -> Red -> Adaptador 1: cambiar de NAT a Adaptador Puente (Bridged Adapter) seleccionando tu tarjeta Wi-Fi o Ethernet activa.")
    p_body("- En la instalación de Ubuntu Server, marcar obligatoriamente '[X] Install OpenSSH server' con usuario 'user' y clave '1234'.")

    # 3. PREPARACIÓN EN LAS VMS
    p_h1("3. Preparación de Paquetes en las VMs")
    p_h2("En la VM BD (192.168.78.126):")
    p_code("sudo apt update && sudo apt install -y openssh-server postgresql postgresql-contrib\nsudo systemctl enable --now ssh && sudo ufw allow 22/tcp && sudo ufw allow 5432/tcp")

    p_h2("En la VM APP (192.168.78.120):")
    p_code("sudo apt update && sudo apt install -y openssh-server openjdk-17-jdk nginx curl\nsudo systemctl enable --now ssh && sudo ufw allow 22/tcp && sudo ufw allow 80/tcp")

    # 4. COMPILACIÓN Y DESPLIEGUE
    p_h1("4. Compilación y Despliegue Automatizado")
    p_body("Desde Windows en PowerShell, compilar y desplegar con el script unificado:")
    p_code(
        "# 1. Compilación del Frontend (Angular 21)\n"
        "cd source/front-end/front-horarios && npm run build\n\n"
        "# 2. Compilación del Backend (Spring Boot 4.1.2)\n"
        "cd source/back-end/api_horarios && .\\gradlew.bat bootJar --no-daemon\n\n"
        "# 3. Despliegue automático hacia ambas VMs\n"
        "powershell -ExecutionPolicy Bypass -File .\\deploy_vbox.ps1 -SkipBuild"
    )

    # 5. PUNTOS DE ACCESO Y VERIFICACIÓN
    p_h1("5. Verificación y Puntos de Acceso")
    p_body("Validación del correcto funcionamiento en el navegador del host Windows:")

    pdf.set_fill_color(27, 54, 93)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(f_family, "B", 8)
    pdf.cell(50, 6, " Componente", border=1, fill=True)
    pdf.cell(70, 6, " URL", border=1, fill=True)
    pdf.cell(70, 6, " Resultado Esperado", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

    v_data = [
        ("Frontend Web (SPA)", "http://192.168.78.120/", "Carga exitosa de la interfaz Angular."),
        ("Login Directo", "http://192.168.78.120/#/login", "Autenticación activa (admin / 123456)."),
        ("Estado Conexión", "http://192.168.78.120/#/conexion", "Indicador verde de conexión activa con API."),
        ("API Echo (Proxy)", "http://192.168.78.120/api/echo", "Respuesta JSON {'status':'UP'}."),
        ("Base de Datos", "192.168.78.126:5432 (sigh)", "46/46 reglas aprobadas (46|46|0)."),
    ]

    for i, (c, u, r) in enumerate(v_data):
        fill = (i % 2 == 1)
        pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
        pdf.set_font(f_family, "B", 8)
        pdf.set_text_color(*PRIMARY)
        pdf.cell(50, 5.5, f" {c}", border=1, fill=True)
        pdf.set_font(f_family, "", 8)
        pdf.set_text_color(*TEXT_COLOR)
        pdf.cell(70, 5.5, f" {u}", border=1, fill=True)
        pdf.cell(70, 5.5, f" {r}", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(4)

    # 6. TROUBLESHOOTING
    p_h1("6. Solución de Problemas (Troubleshooting)")
    p_body("1. Error de ExecutionPolicy: Usar el parámetro 'powershell -ExecutionPolicy Bypass'.")
    p_body("2. Error de permisos en sudoers: Reparar desde el modo recuperación de GRUB con 'mount -o remount,rw /' y 'chown root:root /etc/sudoers && chmod 440 /etc/sudoers'.")
    p_body("3. Cluster PostgreSQL caído: Recrear cluster limpio en UTF-8 con 'sudo pg_createcluster -u postgres -g postgres -e UTF-8 18 main --start'.")
    p_body("4. Rutas Angular dando 404 en Nginx: Indispensable la directiva 'try_files $uri $uri/ /index.html;' en /etc/nginx/sites-available/default.")

    pdf.output(str(PDF_PATH))
    print(f"    [OK] Archivo PDF guardado en: {PDF_PATH}")


if __name__ == "__main__":
    create_docx()
    create_pdf()
    print("\n>>> ¡GENERACIÓN COMPLETADA CON ÉXITO!")
