import dayjs from 'dayjs';

export function addModalTemplate(options, newEvent, formats, id) {
  return `
  <div class="modal-dialog">
    <form>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${options.addEventModalCaption}</h5>
          <button type="button" class="btn-close" data-mdb-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <section class="summary-section">
            <div class="form-outline my-3" data-mdb-input-init>
              <input type="text" id="${id}addEventSummary" name="summary" class="form-control calendar-summary-input"
              value='${newEvent.summary}' />
              <label class="form-label" for="${id}addEventSummary">${options.summaryCaption}</label>
            </div>
          </section>
          <div class="form-outline my-3" data-mdb-input-init>
            <textarea type="text" id="${id}addEventDescription" name="description" 
              class="form-control">${newEvent.description}</textarea>
            <label class="form-label" for="${id}addEventDescription">
              ${options.descriptionCaption}
            </label>
          </div>
          <div class="d-flex justify-content-between">
            <div class="form-check mx-2">
              <input
                class="form-check-input calendar-long-events-checkbox"
                type="checkbox"
                checked
                id="${id}longEventsCheckbox"
              />
              <label class="form-check-label" for="${id}longEventsCheckbox">
                ${options.allDayCaption}
              </label>
            </div>
            <div class="dropdown color-dropdown">
              <button
                class="dropdown-toggle color-dropdown-toggle form-control w-auto"
                type="button"
                id="dropdownMenuButton"
                aria-expanded="false"
              >
                <i class="fas fa-circle" style="color: #cfe0fc"></i>
              </button>
              <ul class="dropdown-menu color-dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
                <li><a class="dropdown-item" name="color" data-background="#cfe0fc" data-foreground="#0a47a9" href="#"><i class="fas fa-circle" style="color: #cfe0fc"></i></a></li>
                <li><a class="dropdown-item" name="color"  data-background="#ebcdfe" data-foreground="#6e02b1" href="#"><i class="fas fa-circle" style="color: #ebcdfe"></i></a></li>
                <li><a class="dropdown-item" name="color"  data-background="#c7f5d9" data-foreground="#0b4121" href="#"><i class="fas fa-circle" style="color: #c7f5d9"></i></a></li>
                <li><a class="dropdown-item" name="color"  data-background="#fdd8de" data-foreground="#790619" href="#"><i class="fas fa-circle" style="color: #fdd8de"></i></a></li>
                <li><a class="dropdown-item" name="color"  data-background="#ffebc2" data-foreground="#453008" href="#"><i class="fas fa-circle" style="color: #ffebc2"></i></a></li>
                <li><a class="dropdown-item" name="color"  data-background="#d0f0fb" data-foreground="#084154" href="#"><i class="fas fa-circle" style="color: #d0f0fb"></i></a></li>
                <li><a class="dropdown-item" name="color"  data-background="#292929" data-foreground="#f5f5f5" href="#"><i class="fas fa-circle" style="color: #292929"></i></a></li>
              </ul>
            </div>
          </div>
          <section class="long-event-section">
            <div class="form-outline datepicker my-3" data-mdb-input-init> 
              <input type="text" id="${id}addEventStartDate" name="start.date" class="form-control calendar-date-input"
              value='${dayjs(newEvent.start.date).format(formats.date)}' />
              <label class="form-label" for="${id}addEventStartDate">
                ${options.startCaption}
              </label>
            </div>
          </section>
          <section class="date-time-section" style="display: none">
            <div class="row my-3">
              <div class="col-6">
                <div class="form-outline datepicker" data-mdb-input-init>
                  <input type="text" id="${id}addEventStartDate2" name="start.date" class="form-control calendar-date-input"
                  value='${dayjs(newEvent.start.dateTime).format(formats.date)}' />
                  <label class="form-label" for="${id}addEventStartDate2">
                    ${options.startCaption}
                  </label>
                </div>
              </div>
              <div class="col-6">
                <div class="form-outline timepicker" data-mdb-input-init>
                  <input type="text" id="${id}addEventStartDateTime" name="start.time" class="form-control calendar-date-input" 
                  value=
                  '${dayjs(newEvent.start.dateTime).format(formats.time)}' 
                  />
                  <label class="form-label" for="${id}addEventStartDateTime">
                    ${options.startCaption}
                  </label>
                </div>
              </div>
            </div>
          </section>
          <section class="long-event-section">
            <div class="form-outline datepicker my-3" data-mdb-input-init>
              <input type="text" id="${id}addEventEndDate" name="end.date" class="form-control calendar-date-input"
              value='${dayjs(newEvent.end.date).format(formats.date)}' />
              <label class="form-label" for="${id}addEventEndDate">
                ${options.endCaption}
              </label>
            </div>
          </section>
          <section class="date-time-section" style="display: none">
            <div class="row my-3">
              <div class="col-6">
                <div class="form-outline datepicker" data-mdb-input-init>
                  <input type="text" id="${id}addEventEndDate2" name="end.date" class="form-control calendar-date-input"
                  value='${dayjs(newEvent.end.dateTime).format(formats.date)}' />
                  <label class="form-label" for="${id}addEventEndDate2">
                    ${options.endCaption}
                  </label>
                </div>
              </div>
              <div class="col-6">
                <div class="form-outline timepicker" data-mdb-input-init>
                  <input type="text" id="${id}addEventEndDateTime" name="end.time" class="form-control calendar-date-input" 
                  value=
                  '${dayjs(newEvent.end.dateTime).format(formats.time)}' 
                  />
                  <label class="form-label" for="${id}addEventEndDateTime">
                    ${options.endCaption}
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" data-mdb-dismiss="modal">
            ${options.closeCaption}
          </button>
          <button type="submit" class="btn btn-primary btn-add-event">
            ${options.addCaption}
          </button>
        </div>
      </div>
    </form>
  </div>`;
}

export function editModalTemplate(options, activeEvent, formats, id) {
  return `
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">${options.editEventModalCaption}</h5>
        <button type="button" class="btn-close" data-mdb-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <section class="summary-section">
          <div class="form-outline my-3" data-mdb-input-init>
            <input type="text" id="${id}editEventSummary" name="summary" class="form-control calendar-summary-input"
            value='${activeEvent.summary}' />
            <label class="form-label" for="${id}editEventSummary">${options.summaryCaption}</label>
          </div>
        </section>
        <div class="form-outline my-3" data-mdb-input-init>
          <textarea type="text" id="${id}editEventDescription" name="description" 
            class="form-control" rows="3"
            >${activeEvent.description === undefined ? '' : activeEvent.description}</textarea>
          <label class="form-label" for="${id}editEventDescription">
            ${options.descriptionCaption}
          </label>
        </div>
        <div class="d-flex justify-content-between">
          <div class="form-check mx-2 mt-1">
            <input
              class="form-check-input calendar-long-events-checkbox"
              type="checkbox"
              checked
              id="${id}longEventsCheckbox"
            />
            <label class="form-check-label" for="${id}longEventsCheckbox">
              ${options.allDayCaption}
            </label>
          </div>
          <div class="dropdown color-dropdown">
            <button
              class="dropdown-toggle color-dropdown-toggle form-control w-auto"
              type="button"
              id="dropdownMenuButton"
              aria-expanded="false"
            >
              <i class="fas fa-circle" style="color: #cfe0fc"></i>
            </button>
            <ul class="dropdown-menu color-dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
              <li><a class="dropdown-item" name="color" data-background="#cfe0fc" data-foreground="#0a47a9" href="#"><i class="fas fa-circle" style="color: #cfe0fc"></i></a></li>
              <li><a class="dropdown-item" name="color"  data-background="#ebcdfe" data-foreground="#6e02b1" href="#"><i class="fas fa-circle" style="color: #ebcdfe"></i></a></li>
              <li><a class="dropdown-item" name="color"  data-background="#c7f5d9" data-foreground="#0b4121" href="#"><i class="fas fa-circle" style="color: #c7f5d9"></i></a></li>
              <li><a class="dropdown-item" name="color"  data-background="#fdd8de" data-foreground="#790619" href="#"><i class="fas fa-circle" style="color: #fdd8de"></i></a></li>
              <li><a class="dropdown-item" name="color"  data-background="#ffebc2" data-foreground="#453008" href="#"><i class="fas fa-circle" style="color: #ffebc2"></i></a></li>
              <li><a class="dropdown-item" name="color"  data-background="#d0f0fb" data-foreground="#084154" href="#"><i class="fas fa-circle" style="color: #d0f0fb"></i></a></li>
              <li><a class="dropdown-item" name="color"  data-background="#292929" data-foreground="#f5f5f5" href="#"><i class="fas fa-circle" style="color: #292929"></i></a></li>
            </ul>
          </div>
        </div>
        <section class="long-event-section">
          <div class="form-outline datepicker my-3" data-mdb-input-init>
            <input type="text" id="${id}editEventStartDate" name="start.date" class="form-control calendar-date-input"
            value='${dayjs(activeEvent.start.date).format(formats.date)}' />
            <label class="form-label" for="${id}editEventStartDate">
              ${options.startCaption}
            </label>
          </div>
        </section>
        <section class="date-time-section" style="display: none">
          <div class="row my-3">
            <div class="col-6">
              <div class="form-outline datepicker" data-mdb-input-init>
                <input type="text" id="${id}editEventStartDate2" name="start.date" class="form-control calendar-date-input"
                value='${dayjs(activeEvent.start.dateTime).format(formats.date)}' />
                <label class="form-label" for="${id}editEventStartDate2">
                  ${options.startCaption}
                </label>
              </div>
            </div>
            <div class="col-6">
              <div class="form-outline timepicker" data-mdb-input-init>
                <input type="text" id="${id}editEventStartDateTime" name="start.time" class="form-control calendar-date-input" 
                value=
                '${dayjs(activeEvent.start.dateTime).format(formats.time)}' 
                />
                <label class="form-label" for="${id}editEventStartDateTime">
                  ${options.startCaption}
                </label>
              </div>
            </div>
          </div>
        </section>
        <section class="long-event-section">
          <div class="form-outline datepicker my-3" data-mdb-input-init>
            <input type="text" id="${id}editEventEndDate" name="end.date" class="form-control calendar-date-input"
            value='${dayjs(activeEvent.end.date).format(formats.date)}' />
            <label class="form-label" for="${id}editEventEndDate">
              ${options.endCaption}
            </label>
          </div>
        </section>
        <section class="date-time-section" style="display: none">
          <div class="row my-3">
            <div class="col-6">
              <div class="form-outline datepicker" data-mdb-input-init>
                <input type="text" id="${id}editEventEndDate2" name="end.date" class="form-control calendar-date-input"
                value='${dayjs(activeEvent.end.dateTime).format(formats.date)}' />
                <label class="form-label" for="${id}editEventEndDate2">
                  ${options.endCaption}
                </label>
              </div>
            </div>
            <div class="col-6">
              <div class="form-outline timepicker" data-mdb-input-init>
                <input type="text" id="${id}editEventEndDateTime" name="end.time" class="form-control calendar-date-input" 
                value=
                '${dayjs(activeEvent.end.dateTime).format(formats.time)}' 
                />
                <label class="form-label" for="${id}editEventEndDateTime">
                  ${options.endCaption}
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger btn-delete-event" >
          ${options.deleteCaption}
        </button>
        <button type="button" class="btn btn-primary btn-save-event">
          ${options.saveCaption}
        </button>
      </div>
    </div>
  </div>
  `;
}
