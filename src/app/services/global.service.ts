import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  public userName: string = '';
  public userLastName: string = '';
  public userId: string = '';
  public isLoggedIn: boolean = false;
  public companyId : number = -1;
  public id: number = -1;
  public businessEntityName: string = 'x';
  public entityImage: string = '';
 constructor() {
    this.loadFromsessionStorage();
  }
  private loadFromsessionStorage(): void {
    // Implement the logic to load data from local storage
    this.userName = sessionStorage.getItem('userName') || '';
    this.userLastName = sessionStorage.getItem('userLastName') || '';
    this.userId = sessionStorage.getItem('userId') || '';
    this.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    this.companyId = Number(sessionStorage.getItem('companyId')) || -1;
    this.id = Number(sessionStorage.getItem('id')) || -1;
    this.businessEntityName = sessionStorage.getItem('businessEntityName') || '';
    this.entityImage = sessionStorage.getItem('entityImage') || '';
  }

  private saveTosessionStorage(): void {
    // Implement the logic to save data to local storage
    sessionStorage.setItem('userName', this.userName);
    sessionStorage.setItem('userLastName', this.userLastName);
    sessionStorage.setItem('userId', this.userId);
    sessionStorage.setItem('isLoggedIn', this.isLoggedIn.toString());
    sessionStorage.setItem('companyId', this.companyId.toString());
    sessionStorage.setItem('id', this.id.toString());
    sessionStorage.setItem('businessEntityName', this.businessEntityName);
    sessionStorage.setItem('entityImage', this.entityImage);
    console.log('Entity Image:', this.entityImage);
  }

  clearsessionStorage(): void {
    // Clear specific items
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userLastName');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('companyId');
    sessionStorage.removeItem('id');
    sessionStorage.removeItem('businessEntityName');
    sessionStorage.removeItem('entityImage');
  }


  setUserName(name: string): void {
    this.userName = name;
    this.saveTosessionStorage();
  }

  setUserLastName(lastname: string): void {
    this.userLastName = lastname;
    this.saveTosessionStorage();
  }

  setUserId(userid: string): void {
    this.userId = userid;
    this.saveTosessionStorage();
  }

  setCompanyId(companyid: number): void {
    this.companyId = companyid;
    this.saveTosessionStorage();
  }

  setId(id: number): void {
    this.id = id;
    this.saveTosessionStorage();
  }

  setIsLogged(isLoggedIn: boolean): void {
    this.isLoggedIn = isLoggedIn;
    this.saveTosessionStorage();
  }

  setBusinessEntityName(name: string): void {
    this.businessEntityName = name;
    sessionStorage.setItem('businessEntityName', this.businessEntityName);
    this.saveTosessionStorage();
  }

  getUserName(): string {
    return this.userName;
  }

  getUserLastName(): string {
    return this.userLastName;
  }

  getUserId(): string {
    return this.userId;
  }

  getCompanyId(): number {
    return this.companyId;
  }
  getId(): number {
    return this.id;
  }

  getLoginStatus(): boolean {
    return this.isLoggedIn;
  }

  getBusinessEntityName(): string {
    return this.businessEntityName;
  }

  setEntityImage(image: string): void {
    this.entityImage = image;
    sessionStorage.setItem('entityImage', image);
  }

  getEntityImage(): string {
    return this.entityImage;
  } 

  logout(): void {
    this.clearsessionStorage();
    this.isLoggedIn = false;
    this.userName = '';
    this.userLastName = '';
    this.userId = '';
    this.companyId = -1;
    this.id = -1;
    this.businessEntityName = '';
  }

}
