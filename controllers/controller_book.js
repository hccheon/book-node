const common = require('../config/common');
const msg = require('../value/message');
require('date-utils');

//책 모두 리스트 가져오기
//책 ISBN, 책 이름으로 검색하기 


//책 리스트 모두 가져오기
async function book_get_all() {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn);
    try {

        var query = `SELECT EXISTS (SELECT * FROM book) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};



        if (output[0][0].SUCCESS == 0) {
            result = {
                code: 500,
                rows: 0,
                output: "책이 없습니다."
            }
            return result
        } else {
            query = `SELECT * FROM book;`;
            output = await connection.query(query);

            result = {
                code: 200,
                rows: output[0].length,
                output: output[0]
            }
        }
        return result
    } catch (err) {
        console.error({ err: err })
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    } finally {
        connection.release();
    }
}

//책 ISBN, 책, 저자 이름, id로 검색하기(type, value)
async function book_get_by_type(type, value) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn);
    value = "%"+value+"%";
    try {
        //존재하는 book_list인지 확인
        let query = `SELECT * FROM book WHERE ${connection.escape(type).substring(1,type.length+2-1)} like ${connection.escape(value)};`;
        /* let query = `SELECT _id, title, author, publisher, isbn, link, library, (
            SELECT t_qty, c_qty FROM stock WHERE id = )
        
            FROM book WHERE ${connection.escape(type).substring(1,type.length+2-1)} like ${connection.escape(value)};`; */
        console.log({query});
        let [book_list] = await connection.query(query);

        if (!book_list.length) {
            //book_list이 존재 하지 않는 경우
            return common.successCode(0, "해당 도서가 없습니다.");
        }

        return common.successCode(book_list.length, book_list);

    } catch (err) {
        console.log({err});
        return common.errorCode("오류");
    } finally {
        connection.release();
    }
}

//책 id로 검색하기(id)
async function book_get_by_id(id) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn);

    try {
        //존재하는 book_list인지 확인
        let query = `SELECT b._id, b.title, b.author, b.publisher, b.isbn, b.link, b.library, s.t_qty, s.c_qty, s.datetime
            FROM book b, stock s
            WHERE b._id = s.book_id and b._id=${connection.escape(id)} 
            order by s.datetime DESC limit 1;`;
        
        //console.log({query});
        let [book_list] = await connection.query(query);

        if (!book_list.length) {
            //book_list이 존재 하지 않는 경우
            return common.successCode(0, "해당 도서가 없습니다.");
        }

        return common.successCode(book_list.length, book_list);

    } catch (err) {
        console.log({err});
        return common.errorCode("오류");
    } finally {
        connection.release();
    }
}

//책 user로 검색하기(user)
async function book_get_by_user(user) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn);

    try {
        //user가 대출 중인 책이 존재하는지 확인
        let query = `SELECT b._id as book_id, b.title, b.author, b.publisher, b.isbn, b.link, b.library, s._id as stock_id, s.lend_id, s.return_id, s.t_qty, s.c_qty, s.qty
            FROM book b, stock s
            WHERE b._id = s.book_id AND s.user = ${connection.escape(user)} AND s.lend_id IS NOT NULL AND s.return_id IS NULL
            ORDER BY s.datetime ASC;`;
        //console.log({query});
        let [book_list] = await connection.query(query);

        if (!book_list.length) {
            //book_list이 존재 하지 않는 경우
            return common.successCode(0, "해당 도서가 없습니다.");
        }
        return common.successCode(book_list.length, book_list);
        
        /* let [book_list] = await connection.query(query);

        if (!book_list.length) {
            //book_list이 존재 하지 않는 경우
            return common.successCode(0, "해당 도서가 없습니다.");
        }

        return common.successCode(book_list.length, book_list); */

    } catch (err) {
        console.log({err});
        return common.errorCode("오류");
    } finally {
        connection.release();
    }
}

//책 추가
async function book_create_book(title, author, publisher, isbn, link, qty, library) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn)
   

    try {

        //기존 책인지 확인
        let query = `SELECT EXISTS (SELECT * FROM book WHERE isbn=${connection.escape(isbn)} AND library=${connection.escape(library)}) AS SUCCESS;`;
        let [output] = await connection.query(query);
        var result = {};
        if(output[0].SUCCESS>0){
           return common.successCode(output.length, "이미 추가된 책입니다."); 
        }

        //----------------
        //책 추가하기 

        query = `INSERT INTO book(title, author, publisher, isbn, link, qty, library)
                    VALUES(${connection.escape(title)}, ${connection.escape(author)}, ${connection.escape(publisher)}, ${connection.escape(isbn)}, ${connection.escape(link)}, ${connection.escape(qty)}, ${connection.escape(library)});`;
        await connection.query(query);

        query = `SELECT _id FROM book WHERE isbn=${connection.escape(isbn)} AND library=${connection.escape(library)}` 
        output = await connection.query(query);
        book_id = common.successCode(output.length, output[0]).output[0]._id
        t_qty = c_qty = qty;
        type = "'" + 'Add' + "'";
        user = "'" + '테스터' + "'";
        query = `INSERT INTO stock(book_id, t_qty, c_qty, qty, type, datetime, user)
                    VALUES(${book_id}, ${t_qty}, ${c_qty}, ${qty}, ${type}, now(), ${user});`;
        //console.log('query = ' + query);
        await connection.query(query);
        
        query = `SELECT * FROM book WHERE isbn = ${connection.escape(isbn)}` 

        output = await connection.query(query);

        return common.successCode(output.length, output[0])
    } catch (err) {
        console.error({ err: err })
        var result = {
            code: 500,
            rows: -1,
            output: "오류"
        }
        return result
    } finally {
        connection.release();
    }
}

//책 수정
async function book_modify_book(title, author, publisher, isbn, link, id, qty, library) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn)
   

    try {

        //기존 책인지 확인
        /* let query = `SELECT EXISTS (SELECT * FROM book WHERE isbn=${connection.escape(isbn)}) AS SUCCESS;`;
        let [output] = await connection.query(query);
        var result = {};
        if(output[0].SUCCESS<0){
           return common.successCode(output.length, "변경할 기존 책이 없습니다."); 
        } */
        let query = `SELECT EXISTS (SELECT * FROM book WHERE isbn=${connection.escape(id)}) AS SUCCESS;`;
        let [output] = await connection.query(query);
        var result = {};
        if(output[0].SUCCESS<0){
           return common.successCode(output.length, "변경할 기존 책이 없습니다."); 
        }

        //----------------
        //책 추가하기 

        query = `UPDATE book SET 
                    title = ${connection.escape(title)}, 
                    author = ${connection.escape(author)}, 
                    publisher = ${connection.escape(publisher)}, 
                    isbn = ${connection.escape(isbn)}, 
                    link = ${connection.escape(link)}, 
                    qty = ${connection.escape(qty)}, 
                    library = ${connection.escape(library)}
                WHERE _id = ${connection.escape(id)}`;
        //console.log(query);
        await connection.query(query);

        query = `SELECT _id, t_qty, c_qty, qty FROM stock WHERE book_id=${connection.escape(id)} ORDER BY DATETIME DESC LIMIT 1` 
        output = await connection.query(query);
        //console.log(common.successCode(output.length, output[0]));
        //console.log(common.successCode(output.length, output[0]).output[0].t_qty);
        stock_id = common.successCode(output.length, output[0]).output[0]._id;
        t_qty = common.successCode(output.length, output[0]).output[0].t_qty;
        c_qty = common.successCode(output.length, output[0]).output[0].c_qty;
        d_qty = qty - t_qty;
        t_qty = t_qty + d_qty;
        c_qty = c_qty + d_qty;
        //console.log('d_qty = ' + d_qty, 't_qty = '+ t_qty, 'c_qty = '+ c_qty);
        type = "'" + 'Modify' + "'";
        user = "'" + '테스터' + "'";
        query = `INSERT INTO stock(book_id, t_qty, c_qty, qty, type, datetime, user)
        VALUES(${connection.escape(id)}, ${connection.escape(t_qty)}, ${connection.escape(c_qty)}, ${connection.escape(d_qty)}, ${type}, now(), ${user});`;
        //console.log(query);
        await connection.query(query);

        
        
        query = `SELECT * FROM book WHERE isbn = ${connection.escape(isbn)}`; 

        output = await connection.query(query);

        return common.successCode(output.length, output[0])
    } catch (err) {
        console.error({ err: err })
        var result = {
            code: 500,
            rows: -1,
            output: "오류"
        }
        return result
    } finally {
        connection.release();
    }
}

//책 삭제 (key=isbn)
/* async function book_delete_book_isbn(isbn) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn)

    try {
        //존재하는 책인지 확인
        let query = `SELECT EXISTS (SELECT * FROM book WHERE isbn = ${connection.escape(isbn)}) AS SUCCESS;;`;
        let [output] = await connection.query(query);


        if (output[0].SUCCESS==0) {
            //isbn에 해당 도서가 없습니다.
            return common.successCode(0, `${msg.code.S001}`); // 해당도서가 없습니다.
        }

        query = `DELETE FROM book WHERE isbn=${connection.escape(isbn)};`;
        await connection.query(query);
        return common.successCode(1, `${msg.code.S004}`); //삭제되었습니다.

    } catch (err) {
        return common.errorCode("오류");
    } finally {
        connection.release();
    }
} */

//책 삭제 (key=id)
async function book_delete_book(id) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn)

    try {
        //존재하는 책인지 확인
        let query = `SELECT EXISTS (SELECT * FROM book WHERE _id = ${connection.escape(id)}) AS SUCCESS;`;
        
        let [output] = await connection.query(query);


        if (output[0].SUCCESS==0) {
            //isbn에 해당 도서가 없습니다.
            return common.successCode(0, `${msg.code.S001}`); // 해당도서가 없습니다.
        }

        query = `SELECT _id FROM stock WHERE book_id = ${connection.escape(id)} ORDER BY DATETIME DESC LIMIT 1;`;
        console.log(query);
        //await connection.query(query);
        let [stock] = await connection.query(query);
        let stock_id = stock[0]._id
        console.log('stock_id = ' + stock_id);

        user='테스터';
        query = `UPDATE stock SET 
            book_id = NULL, type = 'Delete', user=${connection.escape(user)} WHERE _id = ${stock_id};`;
        console.log(query);
        await connection.query(query);

        query = `DELETE FROM book WHERE _id=${connection.escape(id)};`;
        await connection.query(query);
        console.log(connection.query(query));

        return common.successCode(1, `${msg.code.S004}`); //삭제되었습니다.

    } catch (err) {
        return common.errorCode("오류");
    } finally {
        connection.release();
    }
}

//대출
async function book_lend_book(book_id, qty) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn)
   

    try {
        //책 존재 확인
        let query = `SELECT * FROM stock WHERE book_id=${connection.escape(book_id)} AND return_id is NULL ORDER BY DATETIME DESC LIMIT 1;`;
        console.log({query});
        let [output] = await connection.query(query);
        console.log(output);
        /* if(output[0].SUCCESS>0){
            return common.successCode(output.length, "대출 가능한 책입니다."); 
        } */
        
        let lend_id = common.successCode(output.length, output[0]).output._id;
        //console.log(lend_id);
        t_qty = common.successCode(output.length, output[0]).output.t_qty;
        c_qty = common.successCode(output.length, output[0]).output.c_qty - qty;
        qty = -qty;
        type = 'Lend';
        user = '테스터';
        query = `INSERT INTO stock(book_id, lend_id, t_qty, c_qty, qty, type, datetime, user)
                    VALUES(${connection.escape(book_id)}, ${connection.escape(lend_id)}, ${connection.escape(t_qty)}, ${connection.escape(c_qty)}, ${connection.escape(qty)}, ${connection.escape(type)}, now(), ${connection.escape(user)});`;
        //console.log('query = ' + query);
        output = await connection.query(query);
        return common.successCode(output.length, output[0])



        /* query = `INSERT INTO book(title, author, publisher, isbn, link, qty, library)
                    VALUES(${connection.escape(title)}, ${connection.escape(author)}, ${connection.escape(publisher)}, ${connection.escape(isbn)}, ${connection.escape(link)}, ${connection.escape(qty)}, ${connection.escape(library)});`;
        console.log(query);
        await connection.query(query);
        
        query = `SELECT * FROM book WHERE isbn = ${connection.escape(isbn)}` 

        output = await connection.query(query);

        return common.successCode(output.length, output[0]) */
    } catch (err) {
        console.error({ err: err })
        var result = {
            code: 500,
            rows: -1,
            output: "오류"
        }
        return result
    } finally {
        connection.release();
    }
}

//반납
async function book_return_book(book_id, qty) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn)
   

    try {
        //책 존재 확인
        let query = `SELECT * FROM stock WHERE _id=${connection.escape(book_id)};`;
        //console.log('query = ' + query);
        let [output] = await connection.query(query);
        //console.log(output);

        // if(output[0].SUCCESS>0){
        //     return common.successCode(output.length, "반납 가능한 책입니다."); 
        // }
        
        //let return_id = common.successCode(output.length, output[0]).output._id;
        //console.log(return_id);
        _id = common.successCode(output.length, output[0]).output._id;
        book_id = common.successCode(output.length, output[0]).output.book_id;
        lend_id = common.successCode(output.length, output[0]).output.lend_id;
        return_id = _id;
        t_qty = common.successCode(output.length, output[0]).output.t_qty;
        c_qty = common.successCode(output.length, output[0]).output.c_qty;
        qty = common.successCode(output.length, output[0]).output.qty;
        c_qty = c_qty - qty;
        qty = -qty;
        type = 'Return';
        user = common.successCode(output.length, output[0]).output.user;
        query = `INSERT INTO stock(book_id, lend_id, return_id, t_qty, c_qty, qty, type, datetime, user)
                    VALUES(${connection.escape(book_id)}, ${connection.escape(lend_id)}, ${return_id}, ${connection.escape(t_qty)}, ${connection.escape(c_qty)}, ${connection.escape(qty)}, ${connection.escape(type)}, now(), ${connection.escape(user)});`;
        //console.log('query = ' + query);
        output = await connection.query(query);

        query = `SELECT * FROM stock WHERE book_id=${book_id} AND user=${connection.escape(user)} AND type=${connection.escape(type)} ORDER BY DATETIME DESC LIMIT 1;`;
        //console.log('query = ' + query);
        output = await connection.query(query);
        r1_id = common.successCode(output.length, output[0]).output[0].return_id;
        r2_id = common.successCode(output.length, output[0]).output[0]._id;
        //console.log(r_id);
        query = `UPDATE stock SET 
                    return_id = ${connection.escape(r2_id)} 
                WHERE _id = ${connection.escape(r1_id)};`;
        //console.log(query);
        await connection.query(query);
        console.log(common.successCode(output.length, output[0]));
        //return common.successCode(output.length, output[0]);

        //query = `SELECT * FROM stock WHERE book_id=${book_id} AND user=${connection.escape(user)} AND type=${connection.escape(type)} ORDER BY DATETIME DESC LIMIT 1;`;
        //console.log('query = ' + query);
        //output = await connection.query(query);
        //_id = common.successCode(output.length, output[0]).output._id;

        /* t_qty = common.successCode(output.length, output[0]).output.t_qty;
        c_qty = common.successCode(output.length, output[0]).output.c_qty - qty;
        qty = -qty;
        type = 'Lend';
        user = '테스터';
        query = `INSERT INTO stock(book_id, lend_id, t_qty, c_qty, qty, type, datetime, user)
                    VALUES(${connection.escape(book_id)}, ${connection.escape(lend_id)}, ${connection.escape(t_qty)}, ${connection.escape(c_qty)}, ${connection.escape(qty)}, ${connection.escape(type)}, now(), ${connection.escape(user)});`;
        //console.log('query = ' + query);
        output = await connection.query(query);
        return common.successCode(output.length, output[0]); */



        /* query = `INSERT INTO book(title, author, publisher, isbn, link, qty, library)
                    VALUES(${connection.escape(title)}, ${connection.escape(author)}, ${connection.escape(publisher)}, ${connection.escape(isbn)}, ${connection.escape(link)}, ${connection.escape(qty)}, ${connection.escape(library)});`;
        console.log(query);
        await connection.query(query);
        
        query = `SELECT * FROM book WHERE isbn = ${connection.escape(isbn)}` 

        output = await connection.query(query);

        return common.successCode(output.length, output[0]) */
    } catch (err) {
        console.error({ err: err })
        var result = {
            code: 500,
            rows: -1,
            output: "오류"
        }
        return result
    } finally {
        connection.release();
    }
}

module.exports = {
    book_get_all,
    book_get_by_type,
    book_create_book,
    book_delete_book,
    book_modify_book,
    book_get_by_id,
    book_lend_book,
    book_return_book,
    book_get_by_user,
}

