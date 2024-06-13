import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartData, ChartOptions, ChartPoint } from 'chart.js';
import { Country } from 'src/app/core/models/Olympic';
import { Participation } from 'src/app/core/models/Participation';
import { OlympicService } from 'src/app/core/services/olympic.service';
import 'chartjs-plugin-piechart-outlabels';
import { Router } from '@angular/router';
import { ChartElement } from 'src/app/core/models/ActiveElement';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly title = "Medals per Country";
  readonly color = '#04838f';
  readonly countryColors = ['#793d52', '#89a1db', '#9780a1', '#bfe0f1', '#b8cbe7', '#956065'];

  private country: Country[] = [];
  private countryLabels: string[] = [];
  private ctx!: string | CanvasRenderingContext2D | HTMLCanvasElement | ArrayLike<CanvasRenderingContext2D | HTMLCanvasElement>;
  private myChart: Chart | undefined;
  private allSubscription = new Subscription();

  @ViewChild('chartRef') myChartRef: ElementRef | undefined;
  @ViewChild('medalsTitle') medalsTitle!: ElementRef;
  public numberOfJos = 0;
  public numberOfCountries = 0;
  public principalTitle = this.title;
  public error: Error | undefined;

  constructor(private olympicService: OlympicService, private router: Router, private cdRef: ChangeDetectorRef) {

  }

  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    this.getAllCountrysAndInitializeGraph();
  }


  /**
   * get countrys with their datas and launch method that initialize barChartData and barChartOptions
   */
  getAllCountrysAndInitializeGraph(): void {
    this.allSubscription.add(this.olympicService.getOlympics().subscribe({
      next: (country: Country[]) => {
        this.country = country;
        this.principalTitle = this.title;
        this.medalsTitle.nativeElement.style.backgroundColor = this.color;

        this.initializeNumberOfCountrie(this.country);
        this.initializeNumberOfJos(this.country);
        this.initializeChart(country);

        /*
         utilisé pour détécter les changement des valeurs initialisé dynamiquement car le onClick de
         initializeBarCharOption retournait une erreur lorsqu'on revenait à la page précédente
         */
        this.cdRef.detectChanges();


      },
      error: (error: Error) => this.error = error
    }))

  }

  /**
 *
 * @param country
 */
  initializeChart(country: Country[]) {
    this.ctx = this.myChartRef?.nativeElement.getContext('2d');
    this.myChart = new Chart(this.ctx, {
      type: 'outlabeledPie',
      data: this.initializeBarChartData(country),
      options: this.initializeBarChartOption(),
    });

  }

  /**
   *
   * @param country
   */
  initializeBarChartData(country: Country[]): ChartData {
    return {
      labels: this.getAllLabelsForEachCountry(country),
      datasets: [
        {
          backgroundColor: this.countryColors,
          data: this.getAllMedalsForEachCountry(country),
        },
      ],
    }
  }

  /**
   *
   * @returns
   */
  initializeBarChartOption(): ChartOptions {
    return {
      responsive: true,
      plugins: {
        legend: false,
        outlabels: {
          backgroundColor: 'transparent',
          text: '%l',
          color: 'black',
          stretch: 35,
          font: {
            resizable: true,
            minSize: 12,
            maxSize: 18,
          },
        },
      },
      onClick: (event: MouseEvent, activeElements: ChartElement[]) => {
        if (activeElements.length > 0) {
          this.router.navigateByUrl(`details?country=${activeElements[0].$outlabels.label}`)
        }
      },
    }
  }

  /**
   *()
   * @param country
   * @returns an array that contains the sum of each medals per participation of each country
   */
  getAllMedalsForEachCountry(country: Country[]): number[] {
    return [...country
      .map((oneCountry: Country) => oneCountry.participations
        .map((participation: Participation) => participation.medalsCount)
        .reduce((acc, currentValue) => acc + currentValue)
      )
    ]
  }

  /**
   *
   * @param country
   * @returns an array that contains all country labels
   */
  getAllLabelsForEachCountry(country: Country[]): string[] {
    this.countryLabels = [...country.map((country: Country) => country.country)]
    return this.countryLabels;
  }

  /**
   *
   * @param country
   */
  initializeNumberOfCountrie(country: Country[]): void {
    this.numberOfCountries = country.length;
  }

  /**
   *
   * @param country
   */
  initializeNumberOfJos(country: Country[]): void {
    let numberOfJo = 0;
    country.forEach((country: Country) => {
      if (country.participations.length > numberOfJo) {
        numberOfJo = country.participations.length
      }
    })

    this.numberOfJos = numberOfJo;
  }

  /**
   * sert de notification pour l'erreur lors de la récupération
   */
  checkErrorOfGetCountry() {
    this.principalTitle = "Malheureusement Aucun Pays n'a pas être trouvé"
    this.medalsTitle.nativeElement.style.backgroundColor = 'red';
  }

  ngOnDestroy(): void {
    this.allSubscription.unsubscribe()
  }

}
