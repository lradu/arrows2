/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DiagramListComponent } from './diagram-list.component';

describe('DiagramsComponent', () => {
    let component: DiagramListComponent;
    let fixture: ComponentFixture<DiagramListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
          declarations: [ DiagramListComponent ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DiagramListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
