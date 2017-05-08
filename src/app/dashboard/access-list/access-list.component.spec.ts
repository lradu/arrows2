/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AccessListComponent } from './access-list.component';

describe('AccessListComponent', () => {
    let component: AccessListComponent;
    let fixture: ComponentFixture<AccessListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ AccessListComponent ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AccessListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
