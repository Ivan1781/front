import {Component, OnInit, AfterViewInit, ViewChild, ElementRef} from '@angular/core';
import { Renderer, Stave, StaveNote, TabNote,  RenderContext, Vex} from 'vexflow';
import {debounceTime, fromEvent, Subscription} from 'rxjs';
import {Context} from 'node:vm';


@Component({
  selector: 'app-music-sheet',
  standalone: true,
  templateUrl: './templates/music-sheet.component.html',
  styleUrls: ['./styles/music-sheet.component.css']
})
export class MusicSheetComponent implements OnInit, AfterViewInit {
  @ViewChild('musicContainer', {static: false }) musicContainer!: ElementRef;

  private currentContainerIndex: number = 0;
  private rows: { stave: Stave; renderer: Renderer; context: RenderContext; notes: StaveNote[]; svgContainer :HTMLDivElement }[] = [];

  private resizeSubscription!: Subscription;

  private currentStave!:Stave;
  private currentRenderer!: Renderer;
  private context!: RenderContext;
  private currentNotes: StaveNote[] = [];

  private divContainerForSvg: HTMLDivElement | null = null;

  selectedNote: string = "c/4";
  selectedDuration: string = "1";

  private containerBoundingRect?: DOMRect;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initializeStave();
  }

  private initializeSvgContainer():  HTMLDivElement {
    const svgContainerId = `music-sheet-${this.currentContainerIndex}`;
    const svgContainer = document.createElement('div');
    svgContainer.id = svgContainerId;
    svgContainer.className = 'svg-container';
    const mainElement = document.querySelector('#music-sheet');
    if(mainElement) {
      mainElement.appendChild(svgContainer);
    }
    this.currentContainerIndex++;
    return svgContainer;
  }

  private getContextForSvgContainer(svgContainer: HTMLDivElement): RenderContext {
      this.currentRenderer = new Renderer(svgContainer, Renderer.Backends.SVG);
      return this.currentRenderer.getContext();
  }

  private initializeStave(): void {
    this.divContainerForSvg = this.initializeSvgContainer(); // div
    this.context = this.getContextForSvgContainer(this.divContainerForSvg);

    this.updateStaveContainerSize();

    if(this.containerBoundingRect) {
      this.currentStave = new Stave(0, 0, this.containerBoundingRect.width/100*90);
      this.currentStave.addTimeSignature("4/4");
      this.currentStave.addClef('treble').setContext(this.context).draw();
    }

    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(300))
      .subscribe(() => this.onResize());
  }

  private onResize() {
    console.log("HellO!")
    console.log(this.musicContainer.nativeElement.clientWidth);
    console.log(this.rows.length)

    for(let lineNumber = 0; lineNumber < this.rows.length; lineNumber++) {
        const row = this.rows[lineNumber];
        this.resizeStave(row.context, row.renderer, row.stave, row.notes)
    }
    console.log("******")
    console.log(this.context)
    this.resizeStave(this.context, this.currentRenderer, this.currentStave, this.currentNotes)

  }

  private resizeStave(context: RenderContext, renderer: Renderer, stave:Stave, notes: StaveNote[] ): void {
    context.clear()
    if (this.containerBoundingRect)
      renderer.resize(this.musicContainer.nativeElement.clientWidth,
        this.containerBoundingRect.height)
    stave.setWidth(this.musicContainer.nativeElement.clientWidth)
    context = renderer.getContext();
    stave.setContext(context).draw()
    this.renderStaveNotes(notes, stave, context)
  }

  private updateStaveContainerSize(): void {
      if (!this.divContainerForSvg) return;
      this.containerBoundingRect = this.divContainerForSvg.getBoundingClientRect();
      console.log("boundingRect " + JSON.stringify(this.containerBoundingRect))
      this.currentRenderer.resize(this.containerBoundingRect.width, this.containerBoundingRect.height);
  }

  onNoteChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    if (target) {
      this.selectedNote = target.value;
    }
  }

  onDurationChange(event: Event): void {
    const duration = event.target as HTMLSelectElement | null;
    if(duration) {
      this.selectedDuration = duration.value;
    }
  }

  addNote(): void {
    const note = new StaveNote({
      clef: "treble",
      keys: this.selectedDuration.length > 1 ? ["b/4"] : [this.selectedNote],
      duration: this.selectedDuration
    });
    this.renderCurrentNote(note);
  }

  private renderCurrentNote(newNote:StaveNote): void {
    if (!this.currentStave || !this.context) return;
      this.context.clear();

      // add newNote to the notes array of current stave
      this.currentNotes.push(newNote);
      this.currentStave.setContext(this.context).draw();

      let staveDuration = this.getNotesDuration()

      // if stave completed:
      if (staveDuration == 1) {
        let nextStave = null;
        if(this.divContainerForSvg) {

          this.currentStave.setContext(this.context).draw()
          this.renderStaveNotes(this.currentNotes, this.currentStave, this.context);

          // create row
          let row = {
            stave: this.currentStave,
            renderer: this.currentRenderer,
            context: this.context,
            notes: this.currentNotes,
            svgContainer: this.divContainerForSvg
          }
          this.rows.push(row)

          this.divContainerForSvg = this.initializeSvgContainer();
          this.context = this.getContextForSvgContainer(this.divContainerForSvg);
          this.containerBoundingRect = this.divContainerForSvg.getBoundingClientRect();
          nextStave = new Stave(0, 0, this.containerBoundingRect.width/100*90);

          nextStave.addTimeSignature("4/4");
          nextStave.addClef('treble').setContext(this.context).draw();
          this.updateStaveContainerSize();
        }
        this.currentNotes = [];
        if(nextStave) {
          this.currentStave = nextStave;
        }
        // this.adjustGeneralContainerHeight()
      }
      if (this.currentNotes.length > 0) {
        this.renderStaveNotes(this.currentNotes, this.currentStave, this.context);
      }
  }

  public removePreviousNote():void {
    this.currentNotes.pop();
    this.context.clear();
    if (this.currentNotes.length == 0 && this.rows.length > 0) {
      this.divContainerForSvg?.remove()
      const row = this.rows.pop()
      if (row) {
        this.currentStave = row.stave
        this.currentNotes = row.notes
        this.context = row.context
        this.divContainerForSvg = row.svgContainer
      }
    } else {
      this.currentStave.setContext(this.context).draw();
      this.renderStaveNotes(this.currentNotes, this.currentStave, this.context);
    }
  }

  private renderStaveNotes(notes: StaveNote[], stave: Stave, context: RenderContext):void {
    try {
      const beams = Vex.Flow.Beam.generateBeams(notes);
      Vex.Flow.Formatter.FormatAndDraw(context, stave, notes);
      beams.forEach((beam) => {
        beam.setContext(context).draw();
      });
    } catch (error) {
      console.log("There are no any notes")
    }
  }

  private getNotesDuration(): Number {
    // calculate the duration of stave
    let durations: number[] = this.currentNotes.map((a)=> Number(a.getDuration()));
    console.log(durations);
    let staveDuration = durations.reduce( (a,b)=> a + 1/b, 0 );
    console.log(staveDuration)
    return staveDuration
  }
}
