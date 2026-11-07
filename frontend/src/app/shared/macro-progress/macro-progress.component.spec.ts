import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MacroProgressComponent } from './macro-progress.component';

describe('MacroProgressComponent', () => {
  let fixture: ComponentFixture<MacroProgressComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MacroProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MacroProgressComponent);
    fixture.componentRef.setInput('label', 'Białko');
    element = fixture.nativeElement;
  });

  it('shows progress towards the target', async () => {
    fixture.componentRef.setInput('value', 60);
    fixture.componentRef.setInput('target', 120);
    await fixture.whenStable();

    expect(element.textContent).toContain('/ 120');
    expect(element.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('50');
    expect(element.classList).not.toContain('over');
  });

  it('caps the bar at 100% and marks an exceeded target', async () => {
    fixture.componentRef.setInput('value', 150);
    fixture.componentRef.setInput('target', 120);
    await fixture.whenStable();

    expect(element.querySelector<HTMLElement>('.bar')?.style.width).toBe('100%');
    expect(element.querySelector('.percent')?.textContent).toContain('125%');
    expect(element.classList).toContain('over');
  });

  it('shows only the value when there is no target', async () => {
    fixture.componentRef.setInput('value', 18);
    await fixture.whenStable();

    expect(element.querySelector('[role="progressbar"]')).toBeNull();
    expect(element.querySelector('.amount')?.textContent).toContain('18');
  });
});
